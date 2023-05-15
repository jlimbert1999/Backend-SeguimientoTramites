const { Schema, model } = require('mongoose')
const SolicitanteScheme = Schema({
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
    telefono: {
        type: String
    },
    documento: {
        type: String
    },
    dni: {
        type: String
    },
    tipo: {
        type: String,
        required: true
    }
})
SolicitanteScheme.method('toJSON', function () {
    const { __v, ...object } = this.toObject()
    return object
})

module.exports = model('solicitantes', SolicitanteScheme)