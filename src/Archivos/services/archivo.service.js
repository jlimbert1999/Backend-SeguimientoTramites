const ArchivosModel = require('../models/archivo.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const EntradaModel = require('../../Bandejas/models/entrada.model')
const ExternoModel = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const AccountModel = require('../../Configuraciones/models/cuentas.model')
const EventModel = require('../../Tramites/models/events.model')
const ObjectId = require('mongoose').Types.ObjectId
exports.archiveMail = async (id_mailIn, id_account, id_officer, description) => {
    const mail = await EntradaModel.findById(id_mailIn)
    if (!mail) throw ({ status: 400, message: `No se encontro el envio para archivar` });
    const lastSend = await SalidaModel.findOne({ tramite: mail.tramite, 'emisor.cuenta': mail.emisor.cuenta, 'receptor.cuenta': mail.receptor.cuenta, recibido: true }).sort({ _id: -1 })
    await Promise.all([
        ArchivosModel.create({
            location: lastSend._id,
            account: id_account,
            procedure: mail.tramite,
            officer: id_officer,
            group: mail.tipo,
            description
        }),
        EventModel.create({
            procedure: mail.tramite,
            officer: id_officer,
            group: mail.tipo,
            description: `Ha concluido el tramite debido a: ${description}`
        })
    ])
    await EntradaModel.deleteOne({ _id: id_mailIn })
    const isProcessActive = await EntradaModel.findOne({ tramite: mail.tramite })
    if (!isProcessActive) {
        mail.tipo === 'tramites_externos'
            ? await ExternoModel.findByIdAndUpdate(mail.tramite, { estado: 'CONCLUIDO', fecha_finalizacion: new Date() })
            : await InternoModel.findByIdAndUpdate(mail.tramite, { estado: 'CONCLUIDO', fecha_finalizacion: new Date() })
    }
}
exports.archiveProcedure = async (id_account, id_officer, id_procedure, description, group) => {
    const archive = {
        account: id_account,
        officer: id_officer,
        procedure: id_procedure,
        group,
        description
    }
    await ArchivosModel.create(archive)
}

exports.get = async (id_account) => {
    const account = await AccountModel.findById(id_account).select('dependencia')
    const archives = await ArchivosModel.aggregate([
        {
            $lookup: {
                from: 'cuentas',
                localField: "account",
                foreignField: "_id",
                as: "account",
            },
        },
        {
            $unwind: "$account"
        },
        {
            $project: {
                'account.password': 0,
                'account.login': 0,
                'account.activo': 0
            }
        },
        {
            $lookup: {
                from: 'funcionarios',
                localField: "officer",
                foreignField: "_id",
                as: "officer",
            },
        },
        {
            $unwind: "$officer"
        },
        {
            $match: {
                'account.dependencia': ObjectId(account.dependencia)
            }
        },
        {
            $sort: {
                date: -1
            }
        }
    ]);
    await ArchivosModel.populate(archives,
        {
            path: 'procedure',
            select: 'alterno estado'
        }
    )
    return archives
}

exports.unarchive = async (id_archive, id_officer, description) => {
    const archive = await ArchivosModel.findByIdAndDelete(id_archive)
    console.log(archive);
    if (!archive) throw ({ status: 400, message: `El tramite ya ha sido desarchivado` });
    let newState = 'EN REVISION'
    if (!archive.location) {
        newState = 'INSCRITO'
    }
    else {
        let mailOld = await SalidaModel.findById(archive.location)
        if (!mailOld) throw ({ status: 404, message: `No se econtro el flujo de trabajo para desarchivar` });
        mailOld = mailOld.toObject()
        delete mailOld._id
        delete mailOld.__v
        const newMail = new EntradaModel(mailOld)
        await newMail.save()
    }
    await EventModel.create({
        procedure: archive.procedure,
        officer: id_officer,
        group: archive.group,
        description: `Desarchivo de tramite por: ${description}`
    })
    archive.group === 'tramites_externos'
        ? await ExternoModel.findByIdAndUpdate(archive.procedure, { estado: newState })
        : await InternoModel.findByIdAndUpdate(archive.procedure, { estado: newState })
}



