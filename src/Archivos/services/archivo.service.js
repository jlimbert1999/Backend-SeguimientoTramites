const ArchivosModel = require('../models/archivo.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const EntradaModel = require('../../Bandejas/models/entrada.model')
const ExternoModel = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const AccountModel = require('../../Configuraciones/models/cuentas.model')
const EventModel = require('../../Tramites/models/events.model')
const ObjectId = require('mongoose').Types.ObjectId

exports.archiveMail = async (id_dependencie, id_account, id_officer, mail, description) => {
    const lastSend = await SalidaModel.findOne({ tramite: mail.tramite, 'emisor.cuenta': mail.emisor.cuenta, 'receptor.cuenta': mail.receptor.cuenta, recibido: true }).sort({ _id: -1 })
    await ArchivosModel.create({
        dependencie: id_dependencie,
        location: lastSend._id,
        account: id_account,
        procedure: lastSend.tramite,
        officer: id_officer,
        group: lastSend.tipo,
        description: description
    })
}
exports.archiveProcedure = async (id_dependencie, id_account, id_officer, id_procedure, description, group) => {
    const archive = {
        dependencie: id_dependencie,
        account: id_account,
        officer: id_officer,
        procedure: id_procedure,
        group,
        description: description
    }
    await ArchivosModel.create(archive)
}
exports.get = async (id_dependencie, limit, offset) => {

    const [archives, length] = await Promise.all([
        ArchivosModel.find({ dependencie: id_dependencie })
            .populate('procedure', 'alterno estado detalle')
            .populate('officer', 'nombre paterno materno cargo')
            .skip(offset)
            .limit(limit),
        ArchivosModel.count({ dependencie: id_dependencie })
    ])
    console.log('mi', archives);
    return { archives, length }
}
exports.search = async (id_dependencie, text, group, limit, offset) => {
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
            $project: {
                'account._id': 1,
                'account.dependencia': 1,
                'procedure.alterno': 1,
                'procedure.estado': 1,
                'procedure.detalle': 1,
                'group': 1,
                'officer': 1,
                'description': 1,
                'date': 1,
            }
        },
        {
            $match: {
                'account.dependencia': ObjectId(id_dependencie),
                $or: [
                    { 'procedure.alterno': regex },
                    { 'procedure.detalle': regex },
                    { 'procedure.cite': regex }
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
            path: 'officer',
            select: 'nombre paterno materno cargo'
        },
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
        description: `Desarchivo del tramite debido a: ${description}`
    })
    archive.group === 'tramites_externos'
        ? await ExternoModel.findByIdAndUpdate(archive.procedure, { estado: newState })
        : await InternoModel.findByIdAndUpdate(archive.procedure, { estado: newState })
}



