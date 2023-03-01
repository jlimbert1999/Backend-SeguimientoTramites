const { Schema, model } = require('mongoose')

const ArchivoScheme = Schema({
    dependencia: {
        type: Schema.Types.ObjectId,
        ref: 'dependencias'
    },
    ultima_ubicacion: {
        type: String,
        required: true
    },
    tramite: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'tipo'
    },
    tipo: {
        type: String,
        required: true,
        enum: ['tramites_externos', 'tramites_internos']
    },
    fecha: {
        type: Date,
        default: Date.now(),
    },
    funcionario: {
        type: Schema.Types.ObjectId,
        ref: 'funcionarios'
    },
    descripcion: {
        type: String,
        required: true
    },
})
ArchivoScheme.method('toJSON', function () {
    const { __v, ...object } = this.toObject()
    return object
})
module.exports = model('archivos', ArchivoScheme)