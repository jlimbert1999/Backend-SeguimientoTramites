const { Schema, model } = require('mongoose')
const DetallesScheme = Schema({
    id_funcionario: {
        type: String,
        required: true,
    },
    descripcion: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        required: true
    }
})
DetallesScheme.method('toJSON', function () {
    const { __v, ...object } = this.toObject()
    return object
})
module.exports = model('cuentas_detalles', DetallesScheme)