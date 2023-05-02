const { Schema, model } = require('mongoose')

const EventsScheme = Schema({
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
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
})
EventsScheme.method('toJSON', function () {
    const { __v, ...object } = this.toObject()
    return object
})
module.exports = model('eventos', EventsScheme)

