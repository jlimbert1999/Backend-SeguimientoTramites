const { Schema, model } = require('mongoose')

const BandejaSalidaScheme = Schema({
    funcionario_emisor: {
        funcionario: {
            type: Schema.Types.ObjectId,
            ref: 'funcionarios'
        },
        cargo: {
            type: String,
            required:true
        }
    },
    funcionario_receptor: {
        funcionario: {
            type: Schema.Types.ObjectId,
            ref: 'funcionarios'
        },
        cargo: {
            type: String,
            required:true
        }
    },
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
    fecha_recibido: {
        type: Date,
    },
    recibido: {
        type: Boolean
    },
    reenviado: {
        type: Boolean,
        default: false
    },
    motivo_rechazo: {
        type: String
    }


})
BandejaSalidaScheme.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject()
    return object
})
module.exports = model('bandeja_salida', BandejaSalidaScheme)