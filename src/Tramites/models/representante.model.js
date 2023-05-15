const { Schema, model } = require('mongoose')
const RepresentanteScheme = Schema({
    nombre: {
        type: String,
        required: true,
        uppercase: true
    },
    paterno: {
        type: String,
        required: true,
        uppercase: true
    },
    materno: {
        type: String,
        uppercase: true
    },
    telefono: {
        type: String
    },
    dni: {
        type: String,
        required: true
    },
    documento: {
        type: String,
        required: true
    }
})
RepresentanteScheme.method('toJSON', function () {
    const { __v, ...object } = this.toObject()
    return object
})
module.exports = model('representantes', RepresentanteScheme)