const ArchivosModel = require('../models/archivo.model')
class ArchivoService {
    async add(dependencia, ultima_ubicacion, tramite, tipo, funcionario, descripcion) {
        let archivo = { dependencia, ultima_ubicacion, tramite, tipo, funcionario, descripcion }
        const newArchivo = new ArchivosModel(archivo)
        await newArchivo.save()
    }
}

module.exports = ArchivoService