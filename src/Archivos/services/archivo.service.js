const ArchivosModel = require('../models/archivo.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const EntradaModel = require('../../Bandejas/models/entrada.model')
const ExternoModel = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const AccountModel = require('../../Configuraciones/models/cuentas.model')
const EventModel = require('../../Tramites/models/events.model')
exports.archiveMail = async (mailIn, description) => {
    const lastSendMail = await SalidaModel.findOne({ tramite: mailIn.tramite, 'emisor.cuenta': mailIn.emisor.cuenta, 'receptor.cuenta': mailIn.receptor.cuenta, recibido: true }).sort({ _id: -1 })
    if (!lastSendMail) throw ({ status: 404, message: `El tramite no se ha podido archivar. No se encontro un flujo de trabajo` });
    const archive = {
        location: lastSendMail._id,
        procedure: lastSendMail.tramite,
        group: lastSendMail.tipo,
        account: lastSendMail.receptor.cuenta,
        officer: lastSendMail.receptor.funcionario,
        description
    }
    const newArchive = new ArchivosModel(archive)
    await newArchive.save()
}
exports.archiveProcedure = async (id_procedure, id_officer, description, group) => {
    const procedure = group === 'tramites_externos'
        ? await ExternoModel.findById(id_procedure)
        : await InternoModel.findById(id_procedure)
    if (procedure.estado === 'CONCLUIDO' || procedure.estado === 'ANULADO') throw ({ status: 400, message: `El tramite ya esta ${procedure.estado}` });
    const workflow = await SalidaModel.findOne({ tramite: id_procedure })
    if (workflow) throw ({ status: 400, message: 'El tramite ya ha sido enviado, por lo que no se puede concluir' });
    const event = {
        procedure: id_procedure,
        officer: id_officer,
        group,
        description
    }
    await Promise.all([
        ArchivosModel.create({ account: procedure.cuenta, ...event }),
        EventModel.create(event)
    ])
    group === 'tramites_externos'
        ? await ExternoModel.findByIdAndUpdate(id_procedure, { estado: 'CONCLUIDO' })
        : await InternoModel.findByIdAndUpdate(id_procedure, { estado: 'CONCLUIDO' })
}

exports.get = async (id_account) => {
    const account = await AccountModel.findById(id_account).select('dependencia').sort({ date: -1 })
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
    ]);
    await ArchivosModel.populate(archives,
        {
            path: 'procedure',
            select: 'alterno estado'
        }
    )
    console.log(archives);
    return archives
}

exports.unarchive = async (id_archive, id_officer, description) => {
    const archive = await ArchivosModel.findByIdAndDelete(id_archive)
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
    archive.group === 'tramites_externos'
        ? await ExternoModel.findByIdAndUpdate(archive.procedure, { estado: newState, $push: { eventos: { funcionario: id_officer, descripcion: `Desarchivo de tramite por: ${description}` } } })
        : await InternoModel.findByIdAndUpdate(archive.procedure, { estado: newState, $push: { eventos: { funcionario: id_officer, descripcion: `Desarchivo de tramite por: ${description}` } } })
}



