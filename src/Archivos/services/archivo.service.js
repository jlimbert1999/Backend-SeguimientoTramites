const ArchivosModel = require('../models/archivo.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const EntradaModel = require('../../Bandejas/models/entrada.model')
const { ExternoModel } = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')

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
exports.archiveProcedure = async (procedure, groupProcedure, id_officer, description) => {
    const archive = {
        procedure: procedure._id,
        group: groupProcedure,
        account: procedure.cuenta,
        officer: id_officer,
        description
    }
    const newArchive = new ArchivosModel(archive)
    await newArchive.save()
}

exports.get = async (id_account) => {
    return await ArchivosModel.find({ account: id_account })
        .populate('procedure', 'alterno estado')
        .populate('officer', 'nombre paterno materno cargo')
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



