const BandejaEntrada = require("./bandeja-entrada.model");
const BandejaSalida = require("./bandeja-salida.model");
const Cuenta = require("../../../src/Configuraciones/cuentas/cuenta.model");
const { TramiteExterno } = require("../externos/externo.model");
const TramiteInterno = require("../../Seguimiento/internos/interno.model");
const Usuarios = require("../../Configuraciones/usuarios/usuarios.model");
const {
    ErrorResponse,
    SuccessResponse,
} = require("../../../helpers/responses");

const { request, response } = require("express");
const { default: mongoose } = require("mongoose");

const addMail = async (req = request, res = response) => {
    let { receptores, ...data } = req.body;
    let mails = [];
    try {
        // verify if exist duplicate mail for send
        for (const account of receptores) {
            const foundDuplicate = await BandejaEntrada.findOne({
                tramite: data.tramite,
                'receptor.cuenta': account._id
            });
            if (foundDuplicate) {
                return res.status(400).json({
                    ok: false,
                    message: `El funcionario ${account.funcionario.nombre} ${account.funcionario.paterno} ${account.funcionario.materno} ya tiene el tramite en su bandeja de entrada`,
                });
            }
            // Create dto for database
            mails.push({
                ...data,
                emisor: {
                    cuenta: req.id_cuenta,
                    funcionario: req.id_funcionario,
                },
                receptor: {
                    cuenta: account._id,
                    funcionario: account.funcionario._id,
                },
            });
        }
        await BandejaEntrada.findOneAndDelete({
            tramite: data.tramite,
            "receptor.cuenta": req.id_cuenta,
            recibido: true
        });
        await BandejaSalida.insertMany(mails);
        let MailsDB = await BandejaEntrada.insertMany(mails)
        await BandejaEntrada.populate(MailsDB, [
            {
                path: "tramite",
                select: "alterno estado detalle",
            },
            {
                path: "emisor.cuenta",
                select: "_id",
                populate: {
                    path: "dependencia",
                    select: "nombre -_id",
                    populate: {
                        path: "institucion",
                        select: "sigla -_id",
                    },
                },
            },
            {
                path: "emisor.funcionario",
                select: "nombre paterno materno cargo",
            }
        ])
        console.log(MailsDB);


        // Update state tramite for no more sends in admin panel
        // switch (data.tipo) {
        //     case 'tramites_externos':
        //         await TramiteExterno.findByIdAndUpdate(data.tramite, { estado: 'EN REVISION' })
        //         break;
        //     case 'tramites_internos':
        //         await TramiteInterno.findByIdAndUpdate(data.tramite, { estado: 'EN REVISION' })
        //         break;
        //     default:
        //         break;
        // }
        return res.json({
            ok: true,
            mail: MailsDB[0]
        });
    } catch (error) {
        return ErrorResponse(res, error);
    }
};

const getMailsIn = async (req = request, res = response) => {
    let { offset, limit } = req.query;
    offset = offset ? offset : 0;
    limit = limit ? limit : 50;
    offset = offset * limit;
    try {
        const [mails, length] = await Promise.all([
            BandejaEntrada.find({ 'receptor.cuenta': req.id_cuenta })
                .sort({ fecha_envio: -1 })
                .skip(offset)
                .limit(limit)
                .populate({
                    path: "tramite",
                    select: "alterno estado detalle",
                })
                .populate({
                    path: "emisor.cuenta",
                    select: "_id",
                    populate: {
                        path: "dependencia",
                        select: "nombre -_id",
                        populate: {
                            path: "institucion",
                            select: "sigla -_id",
                        },
                    },
                })
                .populate({
                    path: "emisor.funcionario",
                    select: "nombre paterno materno cargo",
                }),
            BandejaEntrada.count({ receptor: req.id_cuenta }),
        ]);
        return res.json({
            ok: true,
            mails,
            length,
        });
    } catch (error) {
        ErrorResponse(res, error);
    }
};

const obtener_bandeja_salida = async (req = request, res = response) => {
    let { offset, limit } = req.query;
    offset = offset ? offset : 0;
    limit = limit ? limit : 10;
    offset = offset * limit;
    try {
        const [tramites, total] = await Promise.all([
            BandejaSalida.find({ "emisor.cuenta": req.id_cuenta })
                .sort({ _id: -1 })
                .skip(offset)
                .limit(limit)
                .populate({
                    path: "tramite",
                    select: "alterno estado",
                    populate: {
                        path: "tipo_tramite",
                        select: "nombre -_id",
                    },
                })
                .populate({
                    path: "receptor.cuenta",
                    select: "_id",
                    populate: [
                        {
                            path: "dependencia",
                            select: "nombre -_id",
                            populate: {
                                path: "institucion",
                                select: "sigla -_id",
                            },
                        },
                    ],
                }),
            BandejaSalida.count({ "emisor.cuenta": req.id_cuenta }),
        ]);
        res.json({
            ok: true,
            tramites,
            total,
        });
    } catch (error) {
        return ErrorResponse(res, err);
    }
};

const getUsers = async (req = request, res = response) => {
    const text = req.params.text;
    const regex = new RegExp(text, "i");
    try {
        const cuentas = await Cuenta.aggregate([
            {
                $lookup: {
                    from: "funcionarios",
                    localField: "funcionario",
                    foreignField: "_id",
                    as: "funcionario",
                },
            },
            {
                $unwind: {
                    path: "$funcionario",
                },
            },
            {
                $project: {
                    "funcionario.nombre": 1,
                    "funcionario.paterno": 1,
                    "funcionario.materno": 1,
                    "funcionario.cargo": 1,
                    "funcionario._id": 1,
                    _id: 1,
                    activo: 1,
                },
            },
            {
                $addFields: {
                    "funcionario.fullname": {
                        $concat: [
                            "$funcionario.nombre",
                            " ",
                            { $ifNull: ["$funcionario.paterno", ""] },
                            " ",
                            { $ifNull: ["$funcionario.materno", ""] },
                        ],
                    },
                },
            },
            {
                $match: {
                    $or: [
                        { "funcionario.fullname": regex },
                        { "funcionario.cargo": regex },
                    ],
                    activo: true,
                    _id: { $ne: mongoose.Types.ObjectId(req.id_cuenta) },
                },
            },
            {
                $project: {
                    activo: 0,
                },
            },
            { $limit: 4 },
        ]);
        return res.json({
            ok: true,
            cuentas,
        });
    } catch (error) {
        return ErrorResponse(res, error);
    }
};

const aceptar_tramite = async (req = request, res = response) => {
    const id_bandeja = req.params.id;
    try {
        const mail = await BandejaEntrada.findByIdAndUpdate(id_bandeja, {
            recibido: true,
        });
        await BandejaSalida.findOneAndUpdate(
            {
                tramite: mail.tramite,
                "emisor.cuenta": mail.emisor.cuenta,
                "receptor.cuenta": mail.receptor.cuenta,
                recibido: null,
            },
            { recibido: true, fecha_recibido: new Date() }
        );
        // switch (mail.tipo) {
        //     case "tramites_internos":
        //         await TramiteInterno.findByIdAndUpdate(mail.tramite, {
        //             estado: "EN REVISION",
        //         });
        //         break;
        //     case "tramites_externos":
        //         await TramiteExterno.findByIdAndUpdate(mail.tramite, {
        //             estado: "EN REVISION",
        //         });
        //         break;
        // }
        res.json({
            ok: true,
            message: "Tramite aceptado",
        });
    } catch (error) {
        console.log("[SERVER]: error (aceptar tramite)", error);
        res.status(500).json({
            ok: true,
            message: "No se ha podido aceptar el tramite",
        });
    }
};

const rechazar_tramite = async (req = request, res = response) => {
    const { motivo_rechazo } = req.body;
    const id_bandeja = req.params.id;
    try {
        // delete mail of in mail and update mail out
        const mailDelete = await BandejaEntrada.findByIdAndDelete(id_bandeja)
        await BandejaSalida.findOneAndUpdate(
            {
                tramite: mailDelete.tramite,
                "emisor.cuenta": mailDelete.emisor.cuenta,
                "receptor.cuenta": mailDelete.receptor.cuenta,
                recibido: null,
            },
            { fecha_recibido: new Date(), motivo_rechazo, recibido: false }
        );

        // verify if exist most one send
        let processActive = await BandejaEntrada.findOne({ tramite: mailDelete.tramite, 'emisor.cuenta': mailDelete.emisor.cuenta })
        if (!processActive) {
            let lastSend = await BandejaSalida.findOne({ tramite: mailDelete.tramite, 'emisor.receptor': mailDelete.emisor.cuenta, recibido: true }).sort({ _id: -1 })
            if (lastSend) {
                lastSend = lastSend.toObject()
                delete lastSend._id
                delete lastSend.__v
                console.log(lastSend)
                const newMail = new BandejaEntrada(lastSend)
                await newMail.save()
            }
            else {
                switch (mailDelete.tipo) {
                    case "tramites_internos":
                        await TramiteInterno.findByIdAndUpdate(mailDelete.tramite, {
                            estado: "INSCRITO",
                        });
                        break;
                    case "tramites_externos":
                        await TramiteExterno.findByIdAndUpdate(mailDelete.tramite, {
                            estado: "INSCRITO",
                        });
                        break;
                }
            }
        }
        // const mail = await BandejaEntrada.findById(id_bandeja);
        // // BUSCAR ULTIMO ENVIO PARA DEVOLVER A SU BANDEJA DE ENTRADA
        // const ultimo_envio = await BandejaSalida.findOne({
        //     tramite: mail.tramite,
        //     "receptor.cuenta": mail.emisor,
        //     recibido: true,
        // }).sort({ _id: -1 });
        // if (ultimo_envio) {
        //     // si existe debe regresar a ese envio
        //     await BandejaEntrada.findByIdAndUpdate(id_bandeja, {
        //         emisor: ultimo_envio.emisor.cuenta,
        //         receptor: ultimo_envio.receptor.cuenta,
        //         recibido: true,
        //         motivo: ultimo_envio.motivo,
        //         cantidad: ultimo_envio.cantidad,
        //         fecha_envio: ultimo_envio.fecha_envio,
        //     });
        // } else {
        //     // si no existe debe eliminarse de bandeja entrada
        //     await BandejaEntrada.findByIdAndDelete(id_bandeja);
        // }
        // await BandejaSalida.findOneAndUpdate(
        //     {
        //         tramite: mail.tramite,
        //         "emisor.cuenta": mail.emisor,
        //         "receptor.cuenta": mail.receptor,
        //         recibido: null,
        //     },
        //     { fecha_recibido: new Date(), motivo_rechazo, recibido: false }
        // );
        // switch (mail.tipo) {
        //     case "tramites_externos":
        //         await TramiteExterno.findByIdAndUpdate(mail.tramite, {
        //             ubicacion: mail.emisor,
        //         });
        //         break;
        //     case "tramites_internos":
        //         await TramiteInterno.findByIdAndUpdate(mail.tramite, {
        //             ubicacion: mail.emisor,
        //         });
        //         break;
        // }
        return res.json({
            ok: true,
            message: "Tramite rechazado",
        });
    } catch (error) {
        return ErrorResponse(res, error)
    }
};

const getDetailsMail = async (req = request, res = response) => {
    const id_bandeja = req.params.id;
    try {
        const mail = await BandejaEntrada.findById(id_bandeja)
            .select("cantidad fecha_envio motivo recibido tramite")
            .populate({
                path: "emisor",
                select: "_id",
                populate: [
                    {
                        path: "funcionario",
                        select: "nombre paterno materno cargo -_id",
                    },
                    {
                        path: "dependencia",
                        select: "nombre -_id",
                        populate: {
                            path: "institucion",
                            select: "sigla -_id",
                        },
                    },
                ],
            });
        res.json({
            ok: true,
            mail,
        });
    } catch (error) {
        console.log("[SERVER]: error (aceptar tramite)", error);
        res.status(500).json({
            ok: true,
            message: "No se ha podido aceptar el tramite",
        });
    }
};

const searchInMails = async (req = request, res = response) => {
    const text = req.params.text;
    let { type, limit, offset } = req.query;
    const regex = new RegExp(text, "i");
    offset = offset * limit;
    try {
        let mails, total;
        if (type === "externo") {
            const ids_tramites = await TramiteExterno.find({
                alterno: regex,
                ubicacion: req.id_cuenta,
            })
                .skip(offset)
                .limit(limit)
                .select("_id");
            mails = await BandejaEntrada.find({
                receptor: req.id_cuenta,
                tramite: { $in: ids_tramites },
            });
            total = await BandejaEntrada.count({
                receptor: req.id_cuenta,
                tramite: { $in: ids_tramites },
            });
        } else {
            const ids_tramites = await TramiteInterno.find({
                alterno: regex,
                ubicacion: req.id_cuenta,
            })
                .skip(offset)
                .limit(limit)
                .select("_id");
            mails = await BandejaEntrada.find({
                receptor: req.id_cuenta,
                tramite: { $in: ids_tramites },
            });
            total = await BandejaEntrada.count({
                receptor: req.id_cuenta,
                tramite: { $in: ids_tramites },
            });
        }
        await BandejaEntrada.populate(mails, {
            path: "tramite",
            select: "alterno estado detalle",
            populate: {
                path: "tipo_tramite",
                select: "nombre -_id",
            },
        });
        await BandejaEntrada.populate(mails, {
            path: "emisor",
            select: "_id",
            populate: [
                {
                    path: "dependencia",
                    select: "nombre -_id",
                    populate: {
                        path: "institucion",
                        select: "sigla -_id",
                    },
                },
                {
                    path: "funcionario",
                    select: "nombre paterno materno cargo",
                },
            ],
        });
        return res.json({
            ok: true,
            mails,
            total,
        });
    } catch (error) {
        ErrorResponse(res, error);
    }
};

const searchInMailsExterno = async (req = request, res = response) => {
    const text = req.params.text;
    let { type, limit, offset } = req.query;
    const regex = new RegExp(text, "i");
    offset = offset * limit;
    try {
        let tramites, total;
        if (type === "alterno") {
            const ids_tramites = TramiteExterno.find({
                alterno: regex,
                cuenta: req.id_cuenta,
            })
                .skip(offset)
                .limit(limit);
            tramites = await BandejaEntrada.find({
                tramite: { $in: ids_tramites },
            })
                .skip(offset)
                .limit(limit);

            total = await BandejaEntrada.count({
                alterno: regex,
                cuenta: req.id_cuenta,
            });
        }
        await BandejaEntrada.populate(tramites, {
            path: "tramite",
            select: "alterno estado detalle",
            populate: {
                path: "tipo_tramite",
                select: "nombre -_id",
            },
        });
        await BandejaEntrada.populate(tramites, {
            path: "emisor",
            select: "_id",
            populate: [
                {
                    path: "dependencia",
                    select: "nombre -_id",
                    populate: {
                        path: "institucion",
                        select: "sigla -_id",
                    },
                },
                {
                    path: "funcionario",
                    select: "nombre paterno materno cargo",
                },
            ],
        });
        return res.json({
            ok: true,
            mails,
            total,
        });
    } catch (error) {
        ErrorResponse(res, error);
    }
};


const returnMail = async (req = request, res = response) => {
    const id_bandeja = req.params.id;
    try {
        const mail = await BandejaEntrada.findById(id_bandeja)
            .select("cantidad fecha_envio motivo recibido tramite")
            .populate({
                path: "emisor",
                select: "_id",
                populate: [
                    {
                        path: "funcionario",
                        select: "nombre paterno materno cargo -_id",
                    },
                    {
                        path: "dependencia",
                        select: "nombre -_id",
                        populate: {
                            path: "institucion",
                            select: "sigla -_id",
                        }
                    },
                ],
            });
        res.json({
            ok: true,
            mail,
        });
    } catch (error) {
        console.log("[SERVER]: error (aceptar tramite)", error);
        res.status(500).json({
            ok: true,
            message: "No se ha podido aceptar el tramite",
        });
    }
};

module.exports = {
    addMail,
    getMailsIn,
    obtener_bandeja_salida,
    aceptar_tramite,
    rechazar_tramite,

    getDetailsMail,

    getUsers,

    searchInMails,
    searchInMailsExterno,
};
