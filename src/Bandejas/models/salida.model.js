const { Schema, model } = require('mongoose')

const BandejaSalidaScheme = Schema({
    emisor: {
        cuenta: {
            type: Schema.Types.ObjectId,
            ref: 'cuentas'
        },
        funcionario: {
            type: Schema.Types.ObjectId,
            ref: 'funcionarios'
        }
    },
    receptor: {
        cuenta: {
            type: Schema.Types.ObjectId,
            ref: 'cuentas'
        },
        funcionario: {
            type: Schema.Types.ObjectId,
            ref: 'funcionarios'
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
    },
    recibido: {
        type: Boolean
    },

    fecha_recibido: {
        type: Date,
    },
    motivo_rechazo: {
        type: String
    },
    numero_interno: {
        type: String
    }
})
BandejaSalidaScheme.method('toJSON', function () {
    const { __v, ...object } = this.toObject()
    return object
})
module.exports = model('bandeja_salida', BandejaSalidaScheme)