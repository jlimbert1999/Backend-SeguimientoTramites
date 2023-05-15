const { Schema, model } = require('mongoose')


const RepresentanteSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        uppercase: true
    },
    paterno: {
        type: String,
        required: true,
        uppercase: true
    },
    materno: {
        type: String,
        uppercase: true
    },
    telefono: {
        type: String
    },
    dni: {
        type: String,
        required: true
    },
    documento: {
        type: String,
        required: true
    }
}, { _id: false });

const SolicitanteSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        uppercase: true
    },
    paterno: {
        type: String,
        uppercase: true
    },
    materno: {
        type: String,
        uppercase: true
    },
    telefono: {
        type: String
    },
    documento: {
        type: String
    },
    dni: {
        type: String
    },
    tipo: {
        type: String,
        required: true,
        enum: ['JURIDICO', 'NATURAL']
    }
}, { _id: false });



const TramiteExternoScheme = Schema({
    tipo_tramite: {
        type: Schema.Types.ObjectId,
        ref: 'tipos_tramites',
        required: true
    },
    representante: {
        type: RepresentanteSchema
    },
    solicitante: {
        type: SolicitanteSchema,
        required: true
    },
    cuenta: {
        type: Schema.Types.ObjectId,
        ref: 'cuentas',
        required: true
    },
    estado: {
        type: String,
        required: true,
        enum: ['INSCRITO', 'EN REVISION', 'OBSERVADO', 'CONCLUIDO', 'ANULADO'],
        default: 'INSCRITO'
    },
    alterno: {
        type: String,
        required: true
    },
    pin: {
        type: Number,
        required: true
    },
    detalle: {
        type: String,
        required: true,
        uppercase: true
    },
    cantidad: {
        type: String,
        required: true
    },
    requerimientos: {
        type: Array
    },
    fecha_registro: {
        type: Date,
        default: Date.now
    },
    fecha_finalizacion: {
        type: Date,
    },
    cite: {
        type: String
    },
    enviado: {
        type: Boolean,
        default: false
    },
})

TramiteExternoScheme.method('toJSON', function () {
    const { __v, ...object } = this.toObject()
    return object
})
module.exports = model('tramites_externos', TramiteExternoScheme)