const { Schema, model } = require('mongoose')

const InstitucionScheme = Schema({
    nombre: {
        type: String,
        required: true
    },
    sigla: {
        type: String,
        required: true,
        unique: true
    },
    activo: {
        type: Boolean,
        default: true
    }
})
InstitucionScheme.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject()
    object.id_institucion = _id
    return object
})
module.exports = model('instituciones', InstitucionScheme)