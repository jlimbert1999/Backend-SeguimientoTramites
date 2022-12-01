const { TramiteExterno, Representante, Solicitante } = require('./tramite.model')
const TiposTramites = require('../../componentes/tramites/tipos/tipoTramite.model')
const BandejaSalida = require('../../seguimiento/bandejas/bandeja-salida.model')
const { request, response } = require('express')
require('dotenv').config()

const agregar_tramite_externo = async (req = request, res = response) => {
    let data = req.body
    let { representante, solicitante, tramite } = data
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
        const tramiteDB = newTramite.save()
        res.json({
            ok: true,
            tramite: tramiteDB
        })
    } catch (error) {
        console.log('[SERVER]: Error (registrar tramite externo) =>', error);
        res.status(500).json({
            ok: true,
            message: 'Error al registrar tramite externo'
        })

    }
}
const obtener_mis_tramites_externos = async (req = request, res = response) => {
    const id_cuenta = req.id_cuenta
    try {
        const tramites = await TramiteExterno.find({ cuenta: id_cuenta })
            .populate('tipo_tramite', 'nombre -_id')
            .populate('solicitante')
            .populate('representante')
            .populate({
                path: 'ubicacion',
                select: '_id',
                populate: {
                    path: 'dependencia',
                    select: 'nombre -_id',
                    populate: {
                        path: 'institucion',
                        select: 'sigla -_id'
                    }
                }
            })
        res.json({
            ok: true,
            tramites
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener tramites)', error);
        res.status(500).json({
            ok: true,
            message: 'Error al obtener mis tramites'
        })

    }
}
const editar_tramite_externo = async (req = request, res = response) => {
    const id_tramite = req.params.id_tramite
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
        await TramiteExterno.findByIdAndUpdate(id_tramite, tramite)
        await Solicitante.findByIdAndUpdate(solicitante._id, solicitante)
        res.json({
            ok: true,
            tramite: {}
        })
    } catch (error) {
        console.log('[SERVER]: error (actualizar tramite externo)', error);
        res.status(500).json({
            ok: true,
            message: 'Error en el servidor'
        })
    }
}

const obtener_all_tramites = async (req = request, res = response) => {
    try {
        const tramites = await Tramite.find({}).populate('cuenta')
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

const obtener_info_tramite = async (req = request, res = response) => {
    const id_tramite = req.params.id
    try {
        const tramite = await TramiteExterno.findById(id_tramite)
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
        const workflow = await BandejaSalida.find({ tramite: tramite }).select('motivo fecha_envio fecha_recibido recibido reenviado')
            .populate({
                path: 'cuenta_emisor',
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
            .populate('funcionario_emisor.funcionario', 'nombre -_id')
            .populate({
                path: 'cuenta_receptor',
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
            .populate('funcionario_receptor.funcionario', 'nombre -_id')
        res.json({
            ok: true,
            data: { tramite, workflow }
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener todos los tramites)', error);
        res.status(500).json({
            ok: true,
            message: 'Error al obtener los tramites'
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






const obtener_tipos_tramites = async (req = request, res = response) => {
    const tipo = req.query.tipo
    try {
        const tiposTramites = await TiposTramites.find({ tipo, activo: true })
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
const obtener_segmentos = async (req = request, res = response) => {
    try {
        const segmentos = await TiposTramites.distinct('segmento')
        res.json({
            ok: true,
            segmentos
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener segmentos de tramites)', error);
        res.status(500).json({
            ok: true,
            message: 'error al obtener segmentos de tramites'
        })
    }
}




module.exports = {
    obtener_segmentos,
    obtener_tipos_tramites,
    obtener_info_tramite,

    agregar_tramite_externo,
    editar_tramite_externo,
    obtener_mis_tramites_externos

}