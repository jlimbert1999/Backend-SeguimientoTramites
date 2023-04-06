const EntradaModel = require('../models/entrada.model')
const SalidaModel = require('../models/salida.model')
const { ExternoModel } = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const CuentaModel = require("../../Configuraciones/models/cuentas.model");
const { default: mongoose } = require("mongoose");


class EntradaService {
    async get(id_cuenta, limit, offset) {
        offset = offset ? offset : 0;
        limit = limit ? limit : 10;
        offset = offset * limit;
        const [mails, length] = await Promise.all([
            EntradaModel.find({ 'receptor.cuenta': id_cuenta })
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
            EntradaModel.count({ 'receptor.cuenta': id_cuenta }),
        ]);
        return { mails, length }
    }

    async acept(id_bandeja) {
        const mail = await EntradaModel.findByIdAndUpdate(id_bandeja, {
            recibido: true,
        });
        if (!mail) {
            // if mail no exist, mail is canceled
            throw ({ status: 400, message: `El envio de este tramite ha sido cancelado` });
        }
        await SalidaModel.findOneAndUpdate(
            {
                tramite: mail.tramite,
                "emisor.cuenta": mail.emisor.cuenta,
                "receptor.cuenta": mail.receptor.cuenta,
                recibido: null,
            },
            { recibido: true, fecha_recibido: new Date() }
        );
        return 'Tramite aceptado'
    }

    async decline(id_bandeja, motivo_rechazo) {
        // delete mail of MailsIn and update MailsOut
        const mail = await EntradaModel.findByIdAndDelete(id_bandeja)
        if (!mail) {
            // if mail no exist, mail is canceled
            throw ({ status: 400, message: `El envio de este tramite ha sido cancelado` });
        }
        await SalidaModel.findOneAndUpdate(
            {
                tramite: mail.tramite,
                "emisor.cuenta": mail.emisor.cuenta,
                "receptor.cuenta": mail.receptor.cuenta,
                recibido: null,
            },
            { fecha_recibido: new Date(), motivo_rechazo, recibido: false }
        );

        // verify if all send for update state
        // const processActive = await EntradaModel.findOne({ tramite: mail.tramite, 'emisor.cuenta': mail.emisor.cuenta })
        // if (!processActive) {
        //     let mailOld = await SalidaModel.findOne({ tramite: mail.tramite, 'receptor.cuenta': mail.emisor.cuenta, recibido: true }).sort({ _id: -1 })
        //     if (mailOld) {
        //         mailOld = mailOld.toObject()
        //         delete mailOld._id
        //         delete mailOld.__v
        //         const newMailOld = new EntradaModel(mailOld)
        //         await newMailOld.save()
        //     }
        //     else {
        //         switch (mail.tipo) {
        //             // case "tramites_internos":
        //             //     tramiteDB = await E.findByIdAndUpdate(mailDelete.tramite, {
        //             //         estado: "INSCRITO",
        //             //     });
        //             //     break;
        //             case "tramites_externos":
        //                 await ExternoModel.findByIdAndUpdate(mail.tramite, {
        //                     estado: "INSCRITO",
        //                 });
        //                 break;
        //         }
        //     }
        // }

        let mailOld = await SalidaModel.findOne({ tramite: mail.tramite, 'receptor.cuenta': mail.emisor.cuenta, recibido: true }).sort({ _id: -1 })
        if (mailOld) {
            const newMailOld = new EntradaModel(mailOld)
            // mailOld = mailOld.toObject()
            // delete mailOld._id
            // delete mailOld.__v
            // delete mailOld.fecha_recibido
            await EntradaModel.updateOne(newMailOld, { $setOnInsert: newMailOld }, { upsert: true })
        }
        else {
            switch (mail.tipo) {
                // case "tramites_internos":
                //     tramiteDB = await E.findByIdAndUpdate(mailDelete.tramite, {
                //         estado: "INSCRITO",
                //     });
                //     break;
                case "tramites_externos":
                    await ExternoModel.findByIdAndUpdate(mail.tramite, {
                        estado: "INSCRITO",
                    });
                    break;
            }
        }
        return 'Tramite rechazado'

    }

    async getDatails(id_bandeja) {
        const details = await EntradaModel.findById(id_bandeja)
            .select("cantidad fecha_envio motivo recibido tramite tipo")
            .populate({
                path: "emisor.cuenta",
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
            }).populate({
                path: "emisor.funcionario",
                select: "nombre paterno materno cargo -_id",
            });

        return details
    }




    async add(receptores, data, id_cuenta, id_funcionario) {
        let mails = [];
        const fecha = new Date()
        for (const account of receptores) {
            const foundDuplicate = await EntradaModel.findOne({
                tramite: data.tramite,
                'receptor.cuenta': account._id,
                'emisor.cuenta': id_cuenta
            });
            if (foundDuplicate) {
                throw ({ status: 405, message: `El funcionario ${account.funcionario.nombre} ${account.funcionario.paterno} ${account.funcionario.materno} ya tiene el tramite en su bandeja de entrada` });
            }
            // Create dto for database
            mails.push({
                ...data,
                fecha_envio: fecha,
                emisor: {
                    cuenta: id_cuenta,
                    funcionario: id_funcionario,
                },
                receptor: {
                    cuenta: account._id,
                    funcionario: account.funcionario._id,
                },
            });
        }

        await EntradaModel.findOneAndDelete({
            tramite: data.tramite,
            "receptor.cuenta": id_cuenta,
            recibido: true
        });
        await SalidaModel.insertMany(mails);
        let MailsDB = await EntradaModel.insertMany(mails)
        switch (data.tipo) {
            case "tramites_internos":
                await InternoModel.findByIdAndUpdate(data.tramite, {
                    estado: "EN REVISION",
                });
                break;
            case "tramites_externos":
                await ExternoModel.findByIdAndUpdate(data.tramite, {
                    estado: "EN REVISION",
                });
                break;
        }
        await EntradaModel.populate(MailsDB, [
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
        return MailsDB
    }

    async getAccounts(text, id_cuenta) {
        const regex = new RegExp(text, "i");
        const cuentas = await CuentaModel.aggregate([
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
                    _id: { $ne: mongoose.Types.ObjectId(id_cuenta) },
                },
            },
            {
                $project: {
                    activo: 0,
                },
            },
            { $limit: 4 },
        ]);
        return cuentas
    }

    async conclude(id_bandeja, funcionario, descripcion) {
        const mail = await EntradaModel.findByIdAndDelete(id_bandeja)
        let processActive = await EntradaModel.findOne({ tramite: mail.tramite })
        let extraUpdate
        if (!processActive) {
            extraUpdate = {
                estado: 'CONCLUIDO', fecha_finalizacion: new Date()
            }
        }
        switch (mail.tipo) {
            case 'tramites_externos':
                await ExternoModel.findByIdAndUpdate(mail.tramite,
                    {
                        extraUpdate,
                        $push: {
                            eventos: {
                                funcionario, descripcion: `Ha concluido el tramite por: ${descripcion}`
                            }
                        }
                    }
                )
                break;
            case 'tramites_internos':

                break;
        }
        return mail
    }

    async search(id_cuenta, text, type, offset, limit) {
        offset = offset ? parseInt(offset) : 0;
        limit = limit ? parseInt(limit) : 10;
        offset = offset * limit;
        const regex = new RegExp(text, "i");
        let data
        if (type === 'EXTERNO') {
            data = await EntradaModel.aggregate([
                // {
                //     $match: {
                //         tipo: 'tramites_externos'
                //     },
                // },
                {
                    $lookup: {
                        from: 'placeholder',
                        // from: "tramites_externos",
                        localField: "tramite",
                        foreignField: "_id",
                        refPath: "tipo",
                        as: "tramite",
                    },
                },
                {
                    $unwind: "$tramite"
                },
                {
                    $match: {
                        'receptor.cuenta': mongoose.Types.ObjectId(id_cuenta),
                        $or: [
                            { "tramite.alterno": regex },
                            { "tramite.detalle": regex },
                            { motivo: regex },
                            { numero_interno: regex },
                        ]
                    },
                },
                {
                    $facet: {
                        paginatedResults: [{ $skip: offset }, { $limit: limit }],
                        totalCount: [
                            {
                                $count: 'count'
                            }
                        ]
                    }
                }
            ]);
        }
        else if (type === 'INTERNO') {
            data = await EntradaModel.aggregate([
                {
                    $match: {
                        tipo: 'tramites_internos'
                    },
                },
                {
                    $lookup: {
                        from: "tramites_internos",
                        localField: "tramite",
                        foreignField: "_id",
                        as: "tramite",
                    },
                },
                {
                    $unwind: "$tramite"
                },
                {
                    $match: {
                        'receptor.cuenta': mongoose.Types.ObjectId(id_cuenta),
                        $or: [
                            { "tramite.alterno": regex },
                            { "tramite.detalle": regex },
                            { motivo: regex },
                            { numero_interno: regex },
                        ]
                    },
                },
                {
                    $facet: {
                        paginatedResults: [{ $skip: offset }, { $limit: limit }],
                        totalCount: [
                            {
                                $count: 'count'
                            }
                        ]
                    }
                }
            ]);
        }
        await EntradaModel.populate(data[0].paginatedResults, [
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
        const mails = data[0].paginatedResults
        const length = data[0].totalCount[0] ? data[0].totalCount[0].count : 0
        return { mails, length }
    }

}



module.exports = EntradaService