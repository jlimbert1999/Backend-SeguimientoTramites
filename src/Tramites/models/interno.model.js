const { Schema, model } = require('mongoose')

const TramiteInternoScheme = Schema({
    tipo_tramite: {
        type: Schema.Types.ObjectId,
        ref: 'tipos_tramites'
    },
    alterno: {
        type: String,
        required: true
    },
    estado: {
        type: String,
        required: true
    },
    cuenta: {
        type: Schema.Types.ObjectId,
        ref: 'cuentas'
    },
    ubicacion: {
        type: Schema.Types.ObjectId,
        ref: 'cuentas'
    },
    detalle: {
        type: String,
        required: true
    },
    cite: {
        type: String
    },
    cantidad: {
        type: String
    },
    remitente: {
        nombre: {
            type: String,
            required: true
        },
        cargo: {
            type: String,
            required: true
        }
    },
    destinatario: {
        nombre: {
            type: String,
            required: true
        },
        cargo: {
            type: String,
            required: true
        }
    },
    fecha_registro: {
        type: Date,
        default: Date.now()
    },
    observaciones: [{
        _id: false,
        id_cuenta: String,
        funcionario: String,
        descripcion: String,
        corregido: {
            type: Boolean,
            default: false
        },
        fecha: {
            type: Date,
            default: Date.now()
        }
    }],
    detalle_conclusion: {
        type: String
    }

})
TramiteInternoScheme.method('toJSON', function () {
    const { __v, ...object } = this.toObject()
    return object
})
module.exports = model('tramites_internos', TramiteInternoScheme)