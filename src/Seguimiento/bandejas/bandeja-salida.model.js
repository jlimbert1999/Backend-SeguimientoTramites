const { Schema, model } = require('mongoose')

const BandejaSalidaScheme = Schema({
    emisor: {
        cuenta: {
            type: Schema.Types.ObjectId,
            ref: 'cuentas'
        },
        funcionario: {
            type: String,
            required: true
        },
        cargo: {
            type: String,
            required: true
        }
    },
    receptor: {
        cuenta: {
            type: Schema.Types.ObjectId,
            ref: 'cuentas'
        },
        funcionario: {
            type: String,
            required: true
        },
        cargo: {
            type: String,
            required: true
        }
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
    cantidad: {
        type: String,
        required: true
    },
    fecha_envio: {
        type: Date,
        required: true
    },
    fecha_recibido: {
        type: Date,
    },
    recibido: {
        type: Boolean
    },
    motivo_rechazo: {
        type: String
    },
    numero_interno: {
        type: String
    }
})
BandejaSalidaScheme.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject()
    return object
})
module.exports = model('bandeja_salida', BandejaSalidaScheme)