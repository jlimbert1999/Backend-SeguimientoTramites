const { Schema, model } = require('mongoose')

const BandejaEntradaScheme = Schema({
    cuenta_emisor: {
        type: Schema.Types.ObjectId,
        ref: 'cuentas'
    },
    cuenta_receptor: {
        type: Schema.Types.ObjectId,
        ref: 'cuentas'
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
    motivo: {
        type: String,
        required: true
    },
    fecha_envio: {
        type: Date,
        required: true
    },
    recibido: {
        type: Boolean,
        default: false
    }
})
BandejaEntradaScheme.method('toJSON', function () {
    //convertir el documento mongoose a object
    const { __v, ...object } = this.toObject()
    return object
})

module.exports = model('bandeja_entrada', BandejaEntradaScheme)