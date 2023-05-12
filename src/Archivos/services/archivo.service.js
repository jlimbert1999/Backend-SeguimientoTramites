const ArchivosModel = require('../models/archivo.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const EntradaModel = require('../../Bandejas/models/entrada.model')
const ExternoModel = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const AccountModel = require('../../Configuraciones/models/cuentas.model')
const EventModel = require('../../Tramites/models/events.model')
const ObjectId = require('mongoose').Types.ObjectId
exports.archiveMail = async (id_account, id_officer, mail, description) => {
    const lastSend = await SalidaModel.findOne({ tramite: mail.tramite, 'emisor.cuenta': mail.emisor.cuenta, 'receptor.cuenta': mail.receptor.cuenta, recibido: true }).sort({ _id: -1 })
    await ArchivosModel.create({
        location: lastSend._id,
        account: id_account,
        procedure: lastSend.tramite,
        officer: id_officer,
        group: lastSend.tipo,
        description: `Ha concluido el tramite debido a: ${description}`
    })
}
exports.archiveProcedure = async (id_account, id_officer, id_procedure, description, group) => {
    const archive = {
        account: id_account,
        officer: id_officer,
        procedure: id_procedure,
        group,
        description: `Ha concluido el tramite debido a: ${description}`
    }
    await ArchivosModel.create(archive)
}
exports.get = async (id_account, limit, offset) => {
    const account = await AccountModel.findById(id_account).select('dependencia')
    const data = await ArchivosModel.aggregate([
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
    await ArchivosModel.populate(data[0].paginatedResults,
        {
            path: 'procedure',
            select: 'alterno estado'
        }
    )
    const archives = data[0].paginatedResults
    const length = data[0].totalCount[0] ? data[0].totalCount[0].count : 0
    return { archives, length }
}
exports.search = async (id_account, text, group, limit, offset) => {
    const account = await AccountModel.findById(id_account).select('dependencia')
    const regex = new RegExp(text, "i");
    group = group === 'EXTERNO' ? 'tramites_externos' : 'tramites_internos'
    const data = await ArchivosModel.aggregate([
        {
            $match: {
                group: group
            },
        },
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
            $addFields: {
                "officer.fullname": {
                    $concat: [
                        "$officer.nombre",
                        " ",
                        { $ifNull: ["$officer.paterno", ""] },
                        " ",
                        { $ifNull: ["$officer.materno", ""] },
                    ],
                },
            },
        },
        {
            $lookup: {
                from: group,
                localField: "procedure",
                foreignField: "_id",
                as: "procedure",
            },
        },
        {
            $unwind: "$procedure"
        },
        {
            $match: {
                'account.dependencia': ObjectId(account.dependencia),
                $or: [
                    { 'procedure.alterno': regex },
                    { 'procedure.detalle': regex },
                    { 'procedure.cite': regex },
                    { 'officer.fullname': regex }
                ]
            }
        },
        {
            $sort: {
                date: -1
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
        }
    ]);
    await ArchivosModel.populate(data[0].paginatedResults,
        {
            path: 'procedure',
            select: 'alterno estado'
        }
    )
    const archives = data[0].paginatedResults
    const length = data[0].totalCount[0] ? data[0].totalCount[0].count : 0
    return { archives, length }
}
exports.unarchive = async (id_archive, id_officer, description) => {
    const archive = await ArchivosModel.findByIdAndDelete(id_archive).populate('procedure', 'estado')
    if (!archive) throw ({ status: 400, message: `El tramite ya ha sido desarchivado` });
    let newState = archive.procedure.estado === 'OBSERVADO' ? 'OBSERVADO' : 'EN REVISION'
    if (archive.location) {
        let mailOld = await SalidaModel.findById(archive.location)
        if (!mailOld) throw ({ status: 404, message: `No se econtro el flujo de trabajo para desarchivar` });
        mailOld = mailOld.toObject()
        delete mailOld._id
        delete mailOld.__v
        await EntradaModel.create(mailOld)
    }
    else {
        newState = 'INSCRITO'
    }
    await EventModel.create({
        officer: id_officer,
        procedure: archive.procedure._id,
        group: archive.group,
        description: `Ha desarchivado el tramite debido a: ${description}`
    })
    archive.group === 'tramites_externos'
        ? await ExternoModel.findByIdAndUpdate(archive.procedure, { estado: newState })
        : await InternoModel.findByIdAndUpdate(archive.procedure, { estado: newState })







}



