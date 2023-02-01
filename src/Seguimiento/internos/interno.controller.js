const Internos = require('./interno.model')
const { request, response } = require('express')

const Usuarios = require('../../Configuraciones/usuarios/usuarios.model')
const TiposTramites = require('../../Configuraciones/tipos-tramites/tipoTramite.model')
const BandejaSalida = require('../bandejas/bandeja-salida.model')
const BandejaEntrada = require('../bandejas/bandeja-entrada.model')
const { SuccessResponse, ErrorResponse } = require('../../../helpers/responses')


const add = async (req = request, res = response) => {
    let tramite = req.body
    tramite.cuenta = req.id_cuenta
    tramite.ubicacion = req.id_cuenta
    tramite.alterno = `${tramite.alterno}-${process.env.CONFIG_YEAR}`
    try {
        const regex = new RegExp(tramite.alterno, 'i')
        let correlativo = await Internos.find({ alterno: regex }).count()
        correlativo += 1
        tramite.alterno = `${tramite.alterno}-${addLeadingZeros(correlativo, 5)}`
        tramite.estado = 'INSCRITO'
        tramite.fecha_registro = new Date()

        const newTramite = new Internos(tramite)
        const tramiteDB = await newTramite.save()
        await Internos.populate(tramiteDB, { path: 'tipo_tramite', select: '-_id nombre' })
        return res.json({
            ok: true,
            tramite: tramiteDB
        })
    } catch (error) {
        ErrorResponse(res, error)
    }
}
const edit = async (req = request, res = response) => {
    try {
        let sentTramite = await BandejaSalida.findOne({ tramite: req.params.id, recibido: true, tipo: 'tramites_internos' })
        if (sentTramite) {
            return res.status(405).json({
                ok: false,
                message: 'El tramite ya ha sido aceptado, por lo que no se puede editar'
            })
        }

        const tramite = await Internos.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('tipo_tramite', '-_id nombre')
        res.json({
            ok: true,
            tramite
        })
    } catch (error) {
        ErrorResponse(res, error)
    }
}
async function get(req = request, res = response) {
    let { offset, limit } = req.query
    offset = offset ? offset : 0
    limit = limit ? limit : 10
    offset = offset * limit
    try {
        const [tramites, total] = await Promise.all([
            Internos.find({ cuenta: req.id_cuenta }).sort({ _id: -1 })
                .skip(offset)
                .limit(limit)
                .populate('tipo_tramite', '-_id nombre'),
            Internos.count({ cuenta: req.id_cuenta })
        ])
        return res.json({
            ok: true,
            tramites,
            total
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}

async function getOne(req = request, res = response) {
    try {
        const [tramite, workflow] = await Promise.all([
            await Internos.findOne({ _id: req.params.id })
                .populate('tipo_tramite', '-_id nombre')
                .populate({
                    path: 'ubicacion',
                    select: '_id',
                    populate: [
                        {
                            path: 'funcionario',
                            select: 'nombre paterno materno cargo -_id'
                        },
                        {
                            path: 'dependencia',
                            select: 'nombre -_id',
                            populate: {
                                path: 'institucion',
                                select: 'sigla -_id'
                            }
                        }
                    ]
                }),
            await BandejaSalida.find({ tramite: req.params.id }).select('-_id -__v')
                .populate({
                    path: 'emisor.cuenta',
                    select: '_id',
                    populate: {
                        path: 'dependencia',
                        select: 'nombre',
                        populate: {
                            path: 'institucion',
                            select: 'sigla'
                        }
                    }
                })
                .populate({
                    path: 'receptor.cuenta',
                    select: '_id',
                    populate: {
                        path: 'dependencia',
                        select: 'nombre',
                        populate: {
                            path: 'institucion',
                            select: 'sigla'
                        }
                    }
                })
        ])
        return res.json({
            ok: true,
            tramite,
            workflow
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}

const concludedTramite = async (req = request, res = response) => {
    const id_tramite = req.params.id
    const { referencia } = req.body
    try {
        await Internos.findByIdAndUpdate(id_tramite, { estado: 'CONCLUIDO', fecha_finalizacion: new Date(), detalle_conclusion: referencia })
        await BandejaEntrada.findOneAndDelete({ tramite: id_tramite })
        res.json({
            ok: true,
            message: 'Tramite finalizado'
        })
    } catch (error) {
        console.log('[SERVER]:Error (finalizar tramite interno) => ', error)
        return res.status(500).json({
            ok: false,
            message: 'Error al finalizar el tramite'
        })
    }
}

const addObservacion = async (req = request, res = response) => {
    const id_tramite = req.params.id
    const { descripcion, funcionario, estado } = req.body
    try {
        const tramitedb = await Internos.findById(id_tramite)
        if (tramitedb.ubicacion != req.id_cuenta) {
            return res.status(400).json({
                ok: false,
                message: 'Usted no esta a cargo del tramite para registrar observaciones'
            })
        }
        let found = tramitedb.observaciones.some(element => element.id_cuenta === req.id_cuenta)
        if (found) {
            return res.status(400).json({
                ok: false,
                message: 'Usted ya ha registrado sus observaciones para este tramite'
            })
        }
        let observacion = {
            id_cuenta: req.id_cuenta,
            funcionario,
            descripcion,
            corregido: false,
            fecha: new Date()
        }
        await Internos.findByIdAndUpdate(id_tramite, {
            $push: {
                observaciones: observacion
            },
            estado: 'OBSERVADO'
        })
        res.json({
            ok: true,
            observacion
        })
    } catch (error) {
        console.log('[SERVER]: error (agregar observacion tramite interno)', error);
        res.status(500).json({
            ok: true,
            message: 'No se pudo agregar la observacion'
        })

    }
}
const putObservacion = async (req = request, res = response) => {
    const id_tramite = req.params.id
    try {
        const tramitedb = await Internos.findOneAndUpdate(
            {
                _id: id_tramite,
                observaciones: {
                    $elemMatch: { id_cuenta: req.id_cuenta }
                }
            }, { $set: { "observaciones.$.corregido": true } }, { new: true })

        let corregido = tramitedb.observaciones.some(obs => obs.corregido === false)
        let newEstado = tramitedb.estado
        if (!corregido) {
            await Internos.findByIdAndUpdate(id_tramite, { estado: 'EN REVISION' })
            newEstado = "EN REVISION"
        }
        res.json({
            ok: true,
            estado: newEstado
        })
    } catch (error) {
        console.log('[SERVER]: error (corregir observacion tramite interno)', error);
        res.status(500).json({
            ok: true,
            message: 'No se pudo corregir la observacion'
        })

    }
}



const addLeadingZeros = (num, totalLength) => {
    return String(num).padStart(totalLength, '0');
}


async function getUsers(req = request, res = response) {
    const termino = req.params.termino
    const regex = new RegExp(termino, 'i')
    try {
        const usuarios = await Usuarios.find({ $or: [{ nombre: regex }, { paterno: regex }, { materno: regex }] }).select('-_id nombre paterno materno cargo').limit(5)
        return res.json({
            ok: true,
            usuarios
        })

    } catch (error) {
        return ErrorResponse(res, error)
    }
}
async function getTypes(req = request, res = response) {
    try {
        const tipos = await TiposTramites.find({ tipo: 'INTERNO', activo: true }).select('nombre segmento')
        return res.json({
            ok: true,
            tipos
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}

const search = async (req = request, res = response) => {
    const text = req.params.text
    let { type, limit, offset } = req.query
    offset = offset ? offset : 0
    limit = limit ? limit : 10
    offset = offset * limit
    const regex = new RegExp(text, 'i')
    try {
        let tramites, total
        switch (type) {
            case 'alterno':
                tramites = await Internos.find({ alterno: regex, cuenta: req.id_cuenta }).skip(offset).limit(limit)
                total = await Internos.count({ alterno: regex, cuenta: req.id_cuenta })
                break;
            case 'remitente':
                tramites = await Internos.find({ cuenta: req.id_cuenta, $or: [{ 'remitente.nombre': regex }, { 'remitente.cargo': regex }] }).skip(offset).limit(limit)
                total = await Internos.count({ cuenta: req.id_cuenta, $or: [{ 'remitente.nombre': regex }, { 'remitente.cargo': regex }] })
                break;
            case 'destinatario':
                tramites = await Internos.find({ cuenta: req.id_cuenta, $or: [{ 'destinatario.nombre': regex }, { 'destinatario.cargo': regex }] }).skip(offset).limit(limit)
                total = await Internos.count({ cuenta: req.id_cuenta, $or: [{ 'destinatario.nombre': regex }, { 'destinatario.cargo': regex }] })
                break;
            case 'cite':
                tramites = await Internos.find({ cite: regex, cuenta: req.id_cuenta }).skip(offset).limit(limit)
                total = await Internos.count({ cite: regex, cuenta: req.id_cuenta })
                break;
        }
        await Internos.populate(tramites, { path: 'tipo_tramite', select: '-_id nombre' })
        return res.json({
            ok: true,
            tramites,
            total
        })
    } catch (error) {
        ErrorResponse(res, error)
    }
}


module.exports = {
    add,
    get,
    edit,
    getOne,

    concludedTramite,

    addObservacion,
    putObservacion,

    getUsers,
    getTypes,

    search
}