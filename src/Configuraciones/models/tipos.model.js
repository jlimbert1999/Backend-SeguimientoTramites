const { Schema, model } = require('mongoose')

const TipoTramiteScheme = Schema({
    nombre: {
        type: String,
        required: true
    },
    segmento: {
        type: String,
        required: true,
        uppercase: true
    },
    requerimientos: [
        {
            nombre: {
                type: String,
                required: true
            },
            activo: {
                type: Boolean,
                default: true
            }
        }
    ],
    tipo: {
        type: String,
        required: true
    },
    activo: {
        type: Boolean,
        default: true
    }
})
TipoTramiteScheme.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject()
    object.id_tipoTramite = _id
    return object
})
module.exports = model('tipos_tramites', TipoTramiteScheme)