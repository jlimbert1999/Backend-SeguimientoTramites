const { Schema, model } = require('mongoose')

const UserScheme = Schema({
    nombre: {
        type: String,
        required: true,
        uppercase: true
    },
    paterno: {
        type: String,
        uppercase: true
    },
    materno: {
        type: String,
        uppercase: true
    },
    dni: {
        type: String,
        required: true,
        unique: true
    },
    telefono: {
        type: Number,
        required: true
    },
    direccion: {
        type: String
    },
    cargo: {
        type: String,
        required: true,
        uppercase: true
    },
    activo: {
        type: Boolean,
        default: true
    },
    cuenta: {
        type: Boolean,
        default: false
    }
})
UserScheme.method('toJSON', function () {
    //convertir el documento mongoose a object
    const { __v, ...object } = this.toObject()
    return object
})
module.exports = model('funcionarios', UserScheme)