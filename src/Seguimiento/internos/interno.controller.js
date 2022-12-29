const Internos = require('./interno.model')
const { request, response } = require('express')

const Usuarios = require('../../Configuraciones/usuarios/usuarios.model')
const TiposTramites = require('../../Configuraciones/tipos-tramites/tipoTramite.model')
const BandejaSalida = require('../bandejas/bandeja-salida.model')


const addInterno = async (req = request, res = response) => {
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
        await Internos.populate(tramiteDB, {
            path: 'ubicacion',
            select: '_id',
            populate: {
                path: 'funcionario',
                select: 'nombre cargo -_id'
            }
        })
        res.json({
            ok: true,
            tramite: tramiteDB
        })
    } catch (error) {
        console.log('[SERVER]: Error (registrar tramite interno) =>', error);
        res.status(500).json({
            ok: true,
            message: 'Error al registrar tramite interno'
        })
    }
}
const PutInterno = async (req = request, res = response) => {
    try {
        const tramite = await Internos.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('tipo_tramite', '-_id nombre')
            .populate({
                path: 'ubicacion',
                select: '_id',
                populate: {
                    path: 'funcionario',
                    select: 'nombre cargo -_id'
                }
            })
        res.json({
            ok: true,
            tramite
        })
    } catch (error) {
        console.log('[SERVER]: Error (editar tramite interno) =>', error);
        res.status(500).json({
            ok: true,
            message: 'Error al editar tramite interno'
        })
    }
}
async function GetInternos(req = request, res = response) {
    let { offset, limit } = req.query
    offset = offset ? offset : 0
    limit = limit ? limit : 10
    offset = offset * limit
    try {
        const tramites = await Internos.find({ cuenta: req.id_cuenta }).sort({ _id: -1 })
            .populate('tipo_tramite', '-_id nombre')
            .populate({
                path: 'ubicacion',
                select: '_id',
                populate: {
                    path: 'funcionario',
                    select: 'nombre cargo -_id'
                }
            })
        return res.json({
            ok: true,
            tramites
        })
    } catch (error) {
        console.log('[SERVER]: error GetInternos => ', error)
        return res.status(500).json({
            ok: false,
            message: 'No se puede obtener los tramite internos'
        })
    }
}

async function GetInterno(req = request, res = response) {
    try {
        const [tramite, workflow] = await Promise.all([
            await Internos.findOne({ _id: req.params.id })
                .populate('tipo_tramite', '-_id nombre')
                .populate({
                    path: 'ubicacion',
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
        console.log('[SERVER]: error GetInterno => ', error)
        return res.status(500).json({
            ok: false,
            message: 'No se pudo obtener la informacion del tramite'
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
        console.log('[SERVER]: error al obtener usuarios para registrar interno => ', error)
        return res.status(500).json({
            ok: false,
            message: 'Error al registrar tramite interno'
        })
    }
}
async function GetTiposTramites(req = request, res = response) {
    try {
        const tipos_tramites = await TiposTramites.find({ tipo: 'INTERNO', activo: true }).select('nombre segmento')
        return res.json({
            ok: true,
            tipos_tramites
        })
    } catch (error) {
        console.log('[SERVER]: error al obtener tipos de tramites internos => ', error)
        return res.status(500).json({
            ok: false,
            message: 'Error al registrar tramite interno'
        })
    }
}
module.exports = {
    addInterno,
    GetInternos,
    PutInterno,
    GetInterno,

    addObservacion,
    putObservacion,

    getUsers,
    GetTiposTramites
}