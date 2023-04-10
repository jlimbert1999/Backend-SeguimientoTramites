const { Schema, model } = require('mongoose')

const RolScheme = Schema({
    role: {
        type: String,
        required: true,
        uppercase: true
    },
    privileges: [
        {
            resource: {
                type: String,
                enum: [
                    'externos',
                    'internos',
                    'entradas',
                    'salidas',
                    'tipos',
                    'usuarios',
                    'cuentas',
                    'instituciones',
                    'dependencias',
                    'reportes',
                    'busquedas',
                    'roles'
                ]
            },
            create: { type: Boolean },
            update: { type: Boolean },
            read: { type: Boolean },
            delete: { type: Boolean },
            _id: false
        }
    ]
})
RolScheme.method('toJSON', function () {
    const { __v, ...object } = this.toObject()
    return object
})
module.exports = model('roles', RolScheme)