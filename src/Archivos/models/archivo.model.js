const { Schema, model } = require('mongoose')

const ArchivoScheme = Schema({
    location: {
        type: String
    },
    procedure: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'group'
    },
    group: {
        type: String,
        required: true,
        enum: ['tramites_externos', 'tramites_internos']
    },
    account: {
        type: Schema.Types.ObjectId,
        ref: 'cuentas'
    },
    officer: {
        type: Schema.Types.ObjectId,
        ref: 'funcionarios'
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now(),
    },
})
ArchivoScheme.method('toJSON', function () {
    const { __v, ...object } = this.toObject()
    return object
})
module.exports = model('archivos', ArchivoScheme)