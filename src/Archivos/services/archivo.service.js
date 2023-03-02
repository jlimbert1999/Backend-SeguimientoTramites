const ArchivosModel = require('../models/archivo.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const EntradaModel = require('../../Bandejas/models/entrada.model')
const { ExternoModel } = require('../../Tramites/models/externo.model')
class ArchivoService {
    async add(dependencia, location, tramite, tipo, funcionario, descripcion) {
        let archivo
        if (location) {
            archivo = { dependencia, location, tramite, tipo, funcionario, descripcion }
        }
        else {
            archivo = { dependencia, tramite, tipo, funcionario, descripcion }
        }
        const newArchivo = new ArchivosModel(archivo)
        await newArchivo.save()
    }
    async get(id_dependencia) {
        const tramites = await ArchivosModel.find({ dependencia: id_dependencia })
            .populate('tramite', 'alterno estado')
            .populate('funcionario', 'nombre paterno materno cargo')
        return tramites
    }

    async unarchive(id_archivo) {
        const archivo = await ArchivosModel.findById(id_archivo).populate('tramite', 'estado')
        if (archivo.location) {
            let mailOld = SalidaModel.findById(archivo.location)
            delete mailOld._id
            delete mailOld.__v
            const newMail = new EntradaModel(mailOld)
            await newMail.save()
            if (archivo.tramite.estado === 'CONCLUIDO') {
                switch (archivo.tipo) {
                    case 'tramites_externos':
                        await ExternoModel.findByIdAndUpdate(archivo.tramite._id, { estado: 'EN REVISION' })
                        break;
                    default:
                        break;
                }
            }
        }
        else {
            switch (archivo.tipo) {
                case 'tramites_externos':
                    await ExternoModel.findByIdAndUpdate(archivo.tramite._id, { estado: 'INSCRITO' })
                    break;
                default:
                    break;
            }
        }
        return 'Tramite desarchivado correctamentes'
    }
}
module.exports = ArchivoService