const EntradaModel = require('../models/entrada.model')
const SalidaModel = require('../models/salida.model')
const ExternoModel = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const CuentaModel = require("../../Configuraciones/models/cuentas.model");
const ObservationModel = require('../../Tramites/models/observations.model')
const { default: mongoose } = require("mongoose");

exports.get = async (id_cuenta, limit, offset) => {
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
        recibido: { $ne: null }
    });
    await SalidaModel.insertMany(mails);
    let MailsDB = await EntradaModel.insertMany(mails)
    data.tipo === 'tramites_externos'
        ? await ExternoModel.findByIdAndUpdate(data.tramite, { enviado: true })
        : await InternoModel.findByIdAndUpdate(data.tramite, { enviado: true })
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
    const regex = new RegExp(text, "i");
    group = group === 'EXTERNO' ? 'tramites_externos' : 'tramites_internos'
    const data = await EntradaModel.aggregate([
        {
            $match: {
                tipo: group,
                'receptor.cuenta': mongoose.Types.ObjectId(id_cuenta)
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

    await EntradaModel.populate(data[0].paginatedResults, {
        path: "emisor.funcionario",
        select: "nombre paterno materno cargo",
    })
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

exports.aceptProcedure = async (id_bandeja) => {
    let mail = await EntradaModel.findByIdAndUpdate(id_bandeja, { recibido: true }, { new: true }).populate('tramite', 'estado');
    if (!mail) throw ({ status: 404, message: `El envio de este tramite ha sido cancelado` });
    await SalidaModel.findOneAndUpdate(
        {
            tramite: mail.tramite._id,
            "emisor.cuenta": mail.emisor.cuenta,
            "receptor.cuenta": mail.receptor.cuenta,
            recibido: null,
        },
        { recibido: true, fecha_recibido: new Date() }
    );
    if (mail.tramite.estado !== 'OBSERVADO') {
        mail.tipo === 'tramites_externos'
            ? await ExternoModel.findByIdAndUpdate(mail.tramite._id, { estado: 'EN REVISION' })
            : await InternoModel.findByIdAndUpdate(mail.tramite._id, { estado: 'EN REVISION' })
        mail.tramite.estado = 'EN REVISION'
    }
    return mail.tramite.estado
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
        mailOld.recibido = false
        const newMailOld = new EntradaModel(mailOld)
        await EntradaModel.updateOne(newMailOld, { $setOnInsert: newMailOld }, { upsert: true })
    }
    else {
        mail.tipo === 'tramites_externos'
            ? await ExternoModel.findByIdAndUpdate(mail.tramite, { enviado: false })
            : await InternoModel.findByIdAndUpdate(mail.tramite, { enviado: false });
    }
}
exports.concludeProcedure = async (id_mailIn, id_account) => {
    const mail = await EntradaModel.findById(id_mailIn).populate('tramite', 'estado')
    if(!mail)  throw ({ status: 404, message: `El envio de este tramite ha sido cancelado` });
    if (mail.tramite.estado === 'OBSERVADO') {
        const pendingObservations = await ObservationModel.findOne({ procedure: mail.tramite._id, account: id_account, solved: false })
        if (pendingObservations) throw ({ status: 400, message: `Usted tiene observaciones para este tramite sin resolver` });
    }
    const mailDelete = await EntradaModel.findByIdAndDelete(id_mailIn)
    const isProcessActive = await EntradaModel.findOne({ tramite: mail.tramite._id })
    if (!isProcessActive) {
        mail.tipo === 'tramites_externos'
            ? await ExternoModel.findByIdAndUpdate(mail.tramite, { estado: 'CONCLUIDO', fecha_finalizacion: new Date() })
            : await InternoModel.findByIdAndUpdate(mail.tramite, { estado: 'CONCLUIDO', fecha_finalizacion: new Date() })
    }
    return mailDelete
}
exports.checkMailManager = async (id_procedure, id_account) => {
    const mail = await EntradaModel.findOne({ tramite: id_procedure, 'receptor.cuenta': id_account, recibido: { $ne: null } })
    if (!mail) throw ({ status: 400, message: `Usted aun no ha aceptado el tramite` });
    return mail
}

exports.getDetailsOfMail = async (id_bandeja) => {
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

exports.getLocationProcedure = async (id_procedure) => {
    const receptors = await EntradaModel.find({ tramite: id_procedure })
        .select('receptor.cuenta -_id')
        .populate({
            path: 'receptor.cuenta',
            select: 'dependencia funcionario -_id',
            populate: [
                {
                    path: 'funcionario',
                    select: 'nombre paterno materno cargo -_id'
                },
                {
                    path: 'dependencia',
                    select: 'nombre -_id'
                }
            ]
        })
    return receptors.map(item => item.receptor)
}

