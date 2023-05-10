const SalidaModel = require('../models/salida.model')
const EntradaModel = require('../models/entrada.model')
const ExternoModel = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const { default: mongoose } = require("mongoose");


exports.get = async (id_cuenta, limit, offset) => {
    const dataPaginated = await SalidaModel.aggregate([
        {
            $match: {
                "emisor.cuenta": id_cuenta
            }
        },
        {
            $group: {
                _id: {
                    'cuenta': '$emisor.cuenta',
                    'tramite': '$tramite',
                    'tipo': '$tipo',
                    'fecha_envio': '$fecha_envio'
                },
                sendings: { $push: "$$ROOT" }
            }
        },
        { $sort: { '_id.fecha_envio': -1 } },
        {
            $facet: {
                paginatedResults: [{ $skip: offset }, { $limit: limit }],
                totalCount: [
                    {
                        $count: 'count'
                    }
                ]
            }
        },
    ])
    for (const mail of dataPaginated[0].paginatedResults) {
        await SalidaModel.populate(mail.sendings, [
            { path: 'receptor.funcionario', select: 'nombre paterno materno cargo' },
            { path: 'tramite', select: 'alterno estado cite detalle' }
        ])
    }
    const mails = dataPaginated[0].paginatedResults
    const length = dataPaginated[0].totalCount[0] ? dataPaginated[0].totalCount[0].count : 0
    return { mails, length }
}
exports.search = async (id_cuenta, text, group, offset, limit) => {
    const regex = new RegExp(text, "i");
    group = group === 'EXTERNO' ? 'tramites_externos' : 'tramites_internos'
    const dataPaginated = await SalidaModel.aggregate([
        {
            $match: {
                tipo: group,
                'emisor.cuenta': mongoose.Types.ObjectId(id_cuenta),
            },
        },
        {
            $group: {
                _id: {
                    'cuenta': '$emisor.cuenta',
                    'tramite': '$tramite',
                    'tipo': '$tipo',
                    'fecha_envio': '$fecha_envio'
                },
                sendings: { $push: "$$ROOT" }
            }
        },
        { $sort: { '_id.fecha_envio': -1 } },
        {
            $lookup: {
                from: group,
                localField: "_id.tramite",
                foreignField: "_id",
                as: "_id.tramite",
            },
        },
        {
            $unwind: "$_id.tramite"
        },
        {
            $project: {
                '_id.tramite._id': 1,
                '_id.tramite.alterno': 1,
                '_id.tramite.detalle': 1,
                '_id.tramite.cite': 1,
                '_id.cuenta': 1,
                '_id.fecha_envio': 1,
                '_id.tipo': 1,
                'sendings': 1
            }
        },
        {
            $match: {
                $or: [
                    { "_id.tramite.alterno": regex },
                    { "_id.tramite.detalle": regex },
                    { "_id.tramite.cite": regex }
                ]
            },
        },
        {
            $set: {
                '_id.tramite': '$_id.tramite._id'
            }
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
        },
    ])
    for (const mail of dataPaginated[0].paginatedResults) {
        await SalidaModel.populate(mail.sendings, [
            { path: 'receptor.funcionario', select: 'nombre paterno materno cargo' },
            { path: 'tramite', select: 'alterno estado cite detalle' }
        ])
    }
    const mails = dataPaginated[0].paginatedResults
    const length = dataPaginated[0].totalCount[0] ? dataPaginated[0].totalCount[0].count : 0
    return { mails, length }
}
exports.cancelOneSend = async (id_mailOut) => {
    const sendMail = await SalidaModel.findById(id_mailOut)
    if (!sendMail) throw ({ status: 400, message: 'No se encontro el envio realizado' });
    if (sendMail.recibido !== undefined) throw ({ status: 400, message: 'El tramite ya ha sido evaluado por el funcionario receptor' });
    await Promise.all([
        SalidaModel.deleteOne({ _id: id_mailOut }),
        EntradaModel.deleteOne({ tramite: sendMail.tramite, 'emisor.cuenta': sendMail.emisor.cuenta, 'receptor.cuenta': sendMail.receptor.cuenta, recibido: null })
    ])
    return await recoverLastMail(sendMail.tramite, sendMail.emisor.cuenta, sendMail.tipo)
}
exports.cancelAllSend = async (id_account, id_procedure, sendDate) => {
    const sendMails = await SalidaModel.find({ tramite: id_procedure, 'emisor.cuenta': id_account, fecha_envio: new Date(sendDate) })
    if (sendMails.length === 0) throw ({ status: 400, message: 'No se encontro el envio realizado' });
    sendMails.forEach(mail => {
        if (mail.recibido !== undefined) throw ({ status: 400, message: 'No se puede cancelar el envio. Algunos funcionarios ya han evaluado el tramite' });
    })
    for (const mail of sendMails) {
        await Promise.all([
            SalidaModel.deleteOne({ _id: mail._id }),
            EntradaModel.deleteOne({ tramite: id_procedure, 'emisor.cuenta': id_account, 'receptor.cuenta': mail.receptor.cuenta })
        ])
    }
    return await recoverLastMail(id_procedure, id_account, sendMails[0].tipo)
}
const recoverLastMail = async (id_procedure, id_currentEmitter, group) => {
    let mailOld = await SalidaModel.findOne({ tramite: id_procedure, 'receptor.cuenta': id_currentEmitter, recibido: true }).sort({ _id: -1 })
    if (!mailOld) {
        group === 'tramites_externos'
            ? await ExternoModel.findByIdAndUpdate(id_procedure, { enviado: false })
            : await InternoModel.findByIdAndUpdate(id_procedure, { enviado: false })
        return 'El tramite ahora se encuentra en su administracion para el reenvio'
    }
    mailOld = mailOld.toObject()
    delete mailOld._id
    delete mailOld.__v
    await EntradaModel.findOneAndUpdate({ tramite: mailOld.tramite, 'receptor.cuenta': mailOld.receptor.cuenta, 'emisor.cuenta': mailOld.emisor.cuenta, recibido: mailOld.recibido }, mailOld, { upsert: true, new: true })
    return 'El tramite ahora se encuentra en su bandeja de entrada para el reenvio'
}

exports.getWorkflowProcedure = async (id_procedure) => {
    return await SalidaModel.find({ tramite: id_procedure }).select('-_id -__v')
        .populate({
            path: 'emisor.cuenta',
            select: '_id',
            populate: {
                path: 'dependencia',
                select: 'nombre',
                populate: {
                    path: 'institucion',
                    select: 'sigla'
                }
            }
        })
        .populate({
            path: 'emisor.funcionario',
            select: '-_id nombre paterno materno cargo',
        })
        .populate({
            path: 'receptor.cuenta',
            select: '_id',
            populate: {
                path: 'dependencia',
                select: 'nombre',
                populate: {
                    path: 'institucion',
                    select: 'sigla'
                }
            }
        })
        .populate({
            path: 'receptor.funcionario',
            select: '-_id nombre paterno materno cargo',
        })

}