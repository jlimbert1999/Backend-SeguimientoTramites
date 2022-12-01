const { Schema, model } = require('mongoose')
const RequerimientoScheme = Schema({
    nombre: {
        type: String,
        required: true
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
    activo: {
        type: Boolean,
        default: true
    }
})
RequerimientoScheme.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject()
    object.id_requerimiento = _id
    return object
})
module.exports = model('requerimientos', RequerimientoScheme)