const EntradaModel = require('../models/entrada.model')
const SalidaModel = require('../models/salida.model')
const ExternoModel = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const CuentaModel = require("../../Configuraciones/models/cuentas.model");
const { default: mongoose } = require("mongoose");
const { getOne: getProcedureExternal } = require('../../Tramites/services/externo.service')
const { getOne: getProcedureInternal } = require('../../Tramites/services/interno.service')

exports.get = async (id_cuenta, limit, offset) => {
    offset = offset ? parseInt(offset) : 0;
    limit = limit ? parseInt(limit) : 10;
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
exports.add = async (receptores, data, id_cuenta, id_funcionario) => {
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
    data.tipo === 'tramites_externos'
        ? await ExternoModel.findByIdAndUpdate(data.tramite, { estado: "EN REVISION" })
        : await InternoModel.findByIdAndUpdate(data.tramite, { estado: "EN REVISION" })

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
exports.search = async (id_cuenta, text, group, offset, limit) => {
    offset = offset ? parseInt(offset) : 0;
    limit = limit ? parseInt(limit) : 10;
    offset = offset * limit;
    const regex = new RegExp(text, "i");
    let data
    group = group === 'EXTERNO' ? 'tramites_externos' : 'tramites_internos'
    data = await EntradaModel.aggregate([
        {
            $match: {
                tipo: group
            },
        },
        {
            $lookup: {
                from: group,
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
exports.searchAccountsForSend = async (text, id_cuenta) => {
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
exports.concludeProcedure = async (id_bandeja, id_funcionario, descripcion) => {
    const mail = await EntradaModel.findByIdAndDelete(id_bandeja)
    let isProcessActive = await EntradaModel.findOne({ tramite: mail.tramite })
    let query = {
        $push: {
            eventos: {
                funcionario: id_funcionario, descripcion: `Tramite concluido debido a: ${descripcion}`
            }
        }
    }
    if (!isProcessActive) {
        Object.assign(query, {
            estado: 'CONCLUIDO', fecha_finalizacion: new Date()
        })
    }
    mail.tipo === 'tramites_externos'
        ? await ExternoModel.findByIdAndUpdate(mail.tramite, query)
        : await InternoModel.findByIdAndUpdate(mail.tramite, query)
    return mail
}
exports.aceptProcedure = async (id_bandeja) => {
    const mail = await EntradaModel.findByIdAndUpdate(id_bandeja, {
        recibido: true,
    }, { new: true });
    if (!mail) throw ({ status: 400, message: `El envio de este tramite ha sido cancelado` });
    await SalidaModel.findOneAndUpdate(
        {
            tramite: mail.tramite,
            "emisor.cuenta": mail.emisor.cuenta,
            "receptor.cuenta": mail.receptor.cuenta,
            recibido: null,
        },
        { recibido: true, fecha_recibido: new Date() }
    );
}
exports.declineProcedure = async (id_bandeja, motivo_rechazo) => {
    const mail = await EntradaModel.findByIdAndDelete(id_bandeja)
    if (!mail) throw ({ status: 400, message: `El envio de este tramite ha sido cancelado` });
    await SalidaModel.findOneAndUpdate(
        {
            tramite: mail.tramite,
            "emisor.cuenta": mail.emisor.cuenta,
            "receptor.cuenta": mail.receptor.cuenta,
            recibido: null,
        },
        { fecha_recibido: new Date(), motivo_rechazo, recibido: false }
    );
    let mailOld = await SalidaModel.findOne({ tramite: mail.tramite, 'receptor.cuenta': mail.emisor.cuenta, recibido: true }).sort({ _id: -1 })
    if (mailOld) {
        const newMailOld = new EntradaModel(mailOld)
        await EntradaModel.updateOne(newMailOld, { $setOnInsert: newMailOld }, { upsert: true })
    }
    else {
        mail.tipo === 'tramites_externos'
            ? await ExternoModel.findByIdAndUpdate(mail.tramite, { estado: "INSCRITO" })
            : await InternoModel.findByIdAndUpdate(mail.tramite, { estado: "INSCRITO" });
    }
}
exports.checkMailManager = async (id_procedure, id_account) => {
    const mail = await EntradaModel.findOne({ tramite: id_procedure, 'receptor.cuenta': id_account, recibido: true })
    if (!mail) throw ({ status: 400, message: `Usted aun no ha aceptado el tramite` });
    return mail
}

exports.getDetailsOfMail = async (id_bandeja) => {
    const mail = await getOne(id_bandeja)
    const allDataProcedure = mail.tipo === 'tramites_externos'
        ? await getProcedureExternal(mail.tramite)
        : await getProcedureInternal(mail.tramite)
    return { mail, allDataProcedure }
}


const getOne = async (id_bandeja) => {
    const imbox = await EntradaModel.findById(id_bandeja)
        .select("cantidad fecha_envio motivo recibido tramite tipo")
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
        }).populate({
            path: "emisor.funcionario",
            select: "nombre paterno materno cargo -_id",
        });
    if (!imbox) throw ({ status: 404, message: `El envio de este tramite ha sido cancelado` });
    return imbox
}


