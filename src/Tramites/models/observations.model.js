const { Schema, model } = require('mongoose')

const ObservationScheme = Schema({
    procedure: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: "group",
    },
    group: {
        type: String,
        required: true,
        enum: ["tramites_externos", "tramites_internos"],
    },
    officer: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'funcionarios'
    },
    account: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'cuentas'
    },
    description: {
        type: String,
        required: true
    },
    solved: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    }
})
ObservationScheme.method('toJSON', function () {
    const { __v, ...object } = this.toObject()
    return object
})
module.exports = model('observaciones', ObservationScheme)