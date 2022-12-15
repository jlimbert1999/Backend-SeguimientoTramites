const { Schema, model } = require('mongoose')

const SolicitanteScheme = Schema({
    nombre: {
        type: String,
        required: true
    },
    telefono: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        required: true
    },
    dni: {
        type: String
    },
    expedido: {
        type: String

    },
    documento: {
        type: String
    }
})
const RepresentanteScheme = Schema({
    nombre: {
        type: String,
        required: true
    },
    telefono: {
        type: String,
        required: true
    },

    dni: {
        type: String,
        required: true
    },
    expedido: {
        type: String,
        required: true
    },
    documento: {
        type: String,
        required: true
    }
})


const TramiteExternoScheme = Schema({
    tipo_tramite: {
        type: Schema.Types.ObjectId,
        ref: 'tipos_tramites'
    },
    representante: {
        type: Schema.Types.ObjectId,
        ref: 'representantes'
    },
    solicitante: {
        type: Schema.Types.ObjectId,
        ref: 'solicitantes',
        required: true
    },
    cuenta: {
        type: Schema.Types.ObjectId,
        ref: 'cuentas',
        required: true
    },
    ubicacion: {
        type: Schema.Types.ObjectId,
        ref: 'cuentas'
    },
    estado: {
        type: String,
        required: true
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
        required: true
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
        required: true
    },
    fecha_finalizacion: {
        type: Date,
    },
    cite: {
        type: String
    },
    observaciones: [{
        _id: false,
        id_cuenta: String,
        funcionario: String,
        descripcion: String,
        corregido: Boolean,
        fecha: Date
    }],

})

SolicitanteScheme.method('toJSON', function () {
    const { __v, ...object } = this.toObject()
    return object
})
RepresentanteScheme.method('toJSON', function () {
    const { __v, ...object } = this.toObject()
    return object
})
TramiteExternoScheme.method('toJSON', function () {
    const { __v, ...object } = this.toObject()
    return object
})

const Solicitante = model('solicitantes', SolicitanteScheme)
const Representante = model('representantes', RepresentanteScheme)
const TramiteExterno = model('tramites_externos', TramiteExternoScheme)

module.exports = {
    Solicitante,
    Representante,
    TramiteExterno
}
