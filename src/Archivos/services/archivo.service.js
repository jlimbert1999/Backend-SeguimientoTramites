const ArchivosModel = require('../models/archivo.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const EntradaModel = require('../../Bandejas/models/entrada.model')
const { ExternoModel } = require('../../Tramites/models/externo.model')

class ArchivoService {
    async archiveMail(mail, funcionario, dependencia, descripcion,) {
        const lastPosition = await SalidaModel.findOne({ tramite: mail.tramite, 'emisor.cuenta': mail.emisor.cuenta, 'receptor.cuenta': mail.receptor.cuenta, recibido: true }).sort({ _id: -1 })
        if (!lastPosition) {
            throw ({ status: 400, message: `El tramite no se ha podido archivar. No se encontro un flujo de trabajo` });
        }
        let archive = {
            location: lastPosition._id,
            tramite: lastPosition.tramite,
            tipo: lastPosition.tipo,
            funcionario,
            dependencia,
            descripcion
        }
        const newArchive = new ArchivosModel(archive)
        await newArchive.save()
    }

    async archiveTramite() {
    }


    async get(id_dependencia) {
        const tramites = await ArchivosModel.find({ dependencia: id_dependencia })
            .populate('tramite', 'alterno estado')
            .populate('funcionario', 'nombre paterno materno cargo')
        return tramites
    }

    async unarchive(id_archivo, funcionario, descripcion) {
        const archivo = await ArchivosModel.findByIdAndDelete(id_archivo).populate('tramite', 'estado')

        if (!archivo) {
            throw ({ status: 400, message: `El tramite ya ha sido desarchivado` });
        }
        let newState
        if (archivo.location) {
            let mailOld = await SalidaModel.findById(archivo.location)
            mailOld = mailOld.toObject()
            delete mailOld._id
            delete mailOld.__v
            const newMail = new EntradaModel(mailOld)
            await newMail.save()
            newState = 'EN REVISION'
        }
        else {
            newState = 'INSCRITO'
        }
        switch (archivo.tipo) {
            case 'tramites_externos':
                await ExternoModel.findByIdAndUpdate(archivo.tramite._id, { estado: newState, $push: { eventos: { funcionario: funcionario, descripcion: `Ha desarchivado el tramite por: ${descripcion}` } } })
                break;
            default:
                break;
        }

        return 'Tramite desarchivado correctamentes'
    }
}
module.exports = ArchivoService