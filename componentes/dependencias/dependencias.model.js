const { Schema, model } = require('mongoose')

const DependenciaScheme = Schema({
    nombre: {
        type: String,
        required: true
    },
    sigla: {
        type: String,
        required: true,
        unique: true
    },
    institucion: {
        type: Schema.Types.ObjectId,
        ref: 'instituciones'
    },
    activo: {
        type: Boolean,
        default:true
    },
})
DependenciaScheme.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject()
    object.id_dependencia = _id
    return object
})

module.exports = model('dependencias', DependenciaScheme)