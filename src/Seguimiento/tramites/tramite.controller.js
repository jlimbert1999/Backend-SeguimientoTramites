const { request, response } = require('express')
require('dotenv').config()
const { TramiteExterno, Solicitante, Representante } = require('./tramite.model')
const TiposTramites = require('../../Configuraciones/tipos-tramites/tipoTramite.model')
const BandejaSalida = require('../../Seguimiento/bandejas/bandeja-salida.model')
const BandejaEntrada = require('../../Seguimiento/bandejas/bandeja-entrada.model')

// TRAMITES EXTERNOS
const addExterno = async (req = request, res = response) => {
    let { representante, solicitante, tramite } = req.body
    tramite.cuenta = req.id_cuenta
    tramite.alterno = `${tramite.alterno}-${process.env.CONFIG_YEAR}`
    try {
        if (representante) {
            const newRepresentante = new Representante(representante)
            const representanteDB = await newRepresentante.save()
            tramite.representante = representanteDB._id
        }
        const newSolicitante = new Solicitante(solicitante)
        const solicitanteDB = await newSolicitante.save()
        tramite.solicitante = solicitanteDB._id

        const regex = new RegExp(tramite.alterno, 'i')
        let correlativo = await TramiteExterno.find({ alterno: regex }).count()
        correlativo += 1
        tramite.alterno = `${tramite.alterno}-${addLeadingZeros(correlativo, 5)}`
        tramite.estado = 'INSCRITO'
        tramite.fecha_registro = new Date()
        tramite.pin = Math.floor(100000 + Math.random() * 900000)

        const newTramite = new TramiteExterno(tramite)
        const tramiteDB = await newTramite.save()
        const elementTable = await TramiteExterno.findById(tramiteDB._id)
            .populate('solicitante')
            .populate('representante')
            .populate('tipo_tramite', 'nombre -_id')
            .populate({
                path: 'ubicacion',
                select: '_id',
                populate: [
                    {
                        path: 'dependencia',
                        select: 'nombre -_id',
                        populate: {
                            path: 'institucion',
                            select: 'sigla -_id'
                        }
                    },
                    {
                        path: 'funcionario',
                        select: 'nombre cargo -_id'
                    }
                ]
            })
        res.json({
            ok: true,
            tramite: elementTable
        })
    } catch (error) {
        console.log('[SERVER]: Error (registrar tramite externo) =>', error);
        res.status(500).json({
            ok: true,
            message: 'Error al registrar tramite externo'
        })

    }
}

const getExternos = async (req = request, res = response) => {
    let { offset, limit } = req.query
    offset = offset ? offset : 0
    limit = limit ? limit : 10
    offset = offset * limit
    try {
        const [tramites, total] = await Promise.all([
            await TramiteExterno.find({ cuenta: req.id_cuenta })
                .sort({ _id: -1 })
                .skip(offset)
                .limit(limit)
                .populate('tipo_tramite', 'nombre -_id')
                .populate('solicitante')
                .populate('representante')
                .populate({
                    path: 'ubicacion',
                    select: '_id',
                    populate: [
                        {
                            path: 'dependencia',
                            select: 'nombre -_id',
                            populate: {
                                path: 'institucion',
                                select: 'sigla -_id'
                            }
                        },
                        {
                            path: 'funcionario',
                            select: 'nombre cargo -_id'
                        }
                    ]
                }),
            await TramiteExterno.count({ cuenta: req.id_cuenta })
        ]);

        res.json({
            ok: true,
            tramites,
            total
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener tramites)', error);
        res.status(500).json({
            ok: true,
            message: 'Error al obtener mis tramites'
        })

    }
}
const editExterno = async (req = request, res = response) => {
    const id_tramite = req.params.id
    const { tramite, solicitante, representante } = req.body
    try {
        if (representante) {
            if (representante._id) {
                await Representante.findByIdAndUpdate(representante._id)
            }
            else {
                const newRepresentante = new Representante(representante)
                const representanteDB = await newRepresentante.save()
                tramite.representante = representanteDB._id
            }
        }
        await Solicitante.findByIdAndUpdate(solicitante._id, solicitante)
        const editTramite = await TramiteExterno.findByIdAndUpdate(id_tramite, tramite, { new: true })
            .populate('tipo_tramite', 'nombre -_id')
            .populate('solicitante')
            .populate('representante')
            .populate({
                path: 'ubicacion',
                select: '_id',
                populate: [
                    {
                        path: 'dependencia',
                        select: 'nombre -_id',
                        populate: {
                            path: 'institucion',
                            select: 'sigla -_id'
                        }
                    },
                    {
                        path: 'funcionario',
                        select: 'nombre cargo -_id'
                    }
                ]
            })
        res.json({
            ok: true,
            tramite: editTramite
        })
    } catch (error) {
        console.log('[SERVER]: error (actualizar tramite externo)', error);
        res.status(500).json({
            ok: true,
            message: 'Error en el servidor'
        })
    }
}


const getExterno = async (req = request, res = response) => {
    try {
        const [workflow, tramite] = await Promise.all([
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
                }),
            await TramiteExterno.findById(req.params.id)
                .populate('solicitante', '-_id')
                .populate('representante', '-_id')
                .populate('tipo_tramite', 'nombre -_id')
                .populate({
                    path: 'ubicacion',
                    populate: [
                        {
                            path: 'funcionario',
                            select: 'nombre cargo -_id'
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
                })
        ])
        res.json({
            ok: true,
            tramite,
            workflow
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener workflow)', error);
        res.status(500).json({
            ok: true,
            message: 'Error al obtener flujo de trabajo'
        })
    }
}


const filtrar_tramites = async (req = request, res = response) => {
    let termino = req.params.termino
    const tipo_filtro = req.query.tipo
    try {
        let tramites
        const regex = new RegExp(termino, 'i')
        if (tipo_filtro == 'Ubicacion') {
            tramites = await Tramite.find({ ubicacion: regex }).populate('cuenta')
        }
        else if (tipo_filtro == 'Modalidad') {
            tramites = await Tramite.find({ modalidad: regex }).populate('cuenta')
        }
        else if (tipo_filtro == 'Origen') {
            tramites = await Tramite.find({ origen: regex }).populate('cuenta')
        }
        res.json({
            ok: true,
            tramites
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener todos los tramites)', error);
        res.status(500).json({
            ok: true,
            message: 'Error al obtener los tramites'
        })
    }
}






const getTiposTramite = async (req = request, res = response) => {
    try {
        const tiposTramites = await TiposTramites.find({ tipo: 'EXTERNO', activo: true })
        let segmentos = []
        tiposTramites.forEach(tipo_tramite => {
            if (!segmentos.includes(tipo_tramite.segmento)) {
                segmentos.push(tipo_tramite.segmento)
            }
        })
        res.json({
            ok: true,
            tiposTramites,
            segmentos

        })
    } catch (error) {
        console.log('[SERVER]: error (obtener tipos de tramites para registro)', error);
        res.status(500).json({
            ok: true,
            message: 'error obtener tipos de tramites para registro'
        })

    }
}


const addLeadingZeros = (num, totalLength) => {
    return String(num).padStart(totalLength, '0');
}







const generateRuta = async (req = request, res = response) => {
    try {
        const tramite = await TramiteExterno.findById(req.params.id).select('estado alterno detalle cantidad fecha_registro')
            .populate('solicitante', 'nombre tipo telefono')
            .populate({
                path: 'cuenta',
                select: 'login -_id',
                populate: [
                    {
                        path: 'funcionario',
                        select: 'nombre cargo -_id'
                    },
                    {
                        path: 'dependencia',
                        select: 'nombre -_id'
                    }
                ]
            })
        const workflow = await BandejaSalida.find({ tramite: req.params.id, recibido: true })
        res.json({
            ok: true,
            tramite,
            workflow
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener data para hoja de ruta)', error);
        res.status(500).json({
            ok: true,
            message: 'Error al generar la hoja de ruta'
        })
    }
}

// Observaciones
const addObservacion = async (req = request, res = response) => {
    const id_tramite = req.params.id
    const { descripcion, funcionario } = req.body
    try {
        const tramitedb = await TramiteExterno.findById(id_tramite)
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
        await TramiteExterno.findByIdAndUpdate(id_tramite, {
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
        console.log('[SERVER]: error (agregar observacion)', error);
        res.status(500).json({
            ok: true,
            message: 'No se pudo agregar la observacion'
        })

    }
}
const putObservacion = async (req = request, res = response) => {
    const id_tramite = req.params.id
    try {
        const tramitedb = await TramiteExterno.findOneAndUpdate(
            {
                _id: id_tramite,
                observaciones: {
                    $elemMatch: { id_cuenta: req.id_cuenta }
                }
            }, { $set: { "observaciones.$.corregido": true } }, { new: true })

        let corregido = tramitedb.observaciones.some(obs => obs.corregido === false)
        let newEstado = tramitedb.estado
        if (!corregido) {
            await TramiteExterno.findByIdAndUpdate(id_tramite, { estado: 'EN REVISION' })
            newEstado = "EN REVISION"
        }
        res.json({
            ok: true,
            estado: newEstado
        })
    } catch (error) {
        console.log('[SERVER]: error (corregir observacion)', error);
        res.status(500).json({
            ok: true,
            message: 'No se pudo corregir la observacion'
        })

    }
}

const concludedTramite = async (req = request, res = response) => {
    const id_tramite = req.params.id
    try {
        await TramiteExterno.findByIdAndUpdate(id_tramite, { estado: 'CONCLUIDO', fecha_finalizacion: new Date() })
        await BandejaEntrada.findOneAndDelete({ tramite: id_tramite })
        res.json({
            ok: true,
            message: 'Tramite finalizado'
        })
    } catch (error) {
        console.log('[SERVER]:Error (finalizar tramite) => ', error)
        return res.status(500).json({
            ok: false,
            message: 'Error al finalizar el tramite'
        })
    }
}
const stopTramite = async (req = request, res = response) => {
    // const id_tramite = req.params.id
    // try {
    //     await TramiteExterno.findByIdAndUpdate(id_tramite, { estado: 'ARCHIVADO'})
    //     await BandejaEntrada.findOneAndDelete({ tramite: id_tramite })
    //     res.json({
    //         ok: true,
    //         message: 'Tramite finalizado'
    //     })
    // } catch (error) {
    //     console.log('[SERVER]:Error (finalizar tramite) => ', error)
    //     return res.status(500).json({
    //         ok: false,
    //         message: 'Error al finalizar el tramite'
    //     })
    // }
}

module.exports = {
    getTiposTramite,


    addExterno,
    editExterno,
    getExternos,
    getExterno,

    addObservacion,
    putObservacion,

    concludedTramite,

    generateRuta

}