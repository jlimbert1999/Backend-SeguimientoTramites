const { Schema, model } = require('mongoose')

const UserScheme = Schema({
    nombre: {
        type: String,
        required: true
    },
    paterno: {
        type: String,
    },
    materno: {
        type: String,
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
    expedido: {
        type: String,
        required: true
    },
    cargo: {
        type: String,
        required: true
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