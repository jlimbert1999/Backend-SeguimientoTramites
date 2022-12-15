const BandejaEntrada = require('./bandeja-entrada.model')
const BandejaSalida = require('./bandeja-salida.model')
const Cuenta = require('../../../src/Configuraciones/cuentas/cuenta.model')
const { TramiteExterno } = require('../tramites/tramite.model')

const { request, response } = require('express')

const agregar_mail = async (req = request, res = response) => {
    let { id_tramite, emisor, receptor, motivo, tipo, cantidad, numero_interno } = req.body
    emisor.cuenta = req.id_cuenta
    const fecha = new Date()
    const mail_entrada = {
        tramite: id_tramite,
        emisor: emisor.cuenta,
        receptor: receptor.cuenta,
        recibido: false,
        motivo,
        cantidad,
        fecha_envio: fecha,
        tipo
    }
    const mail_salida = {
        tramite: id_tramite,
        emisor,
        receptor,
        motivo,
        cantidad,
        fecha_envio: fecha,
        tipo,
        numero_interno
    }
    try {
        await BandejaSalida.create(mail_salida)
        const mail = await BandejaEntrada.findOneAndUpdate({ tramite: id_tramite }, mail_entrada, { upsert: true, new: true })
            .populate({
                path: 'tramite',
                select: 'alterno estado',
                populate: {
                    path: 'tipo_tramite',
                    select: 'nombre -_id'
                }
            })
            .populate({
                path: 'emisor',
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
                        select: 'nombre cargo',
                    }
                ]
            })
        await TramiteExterno.findByIdAndUpdate(id_tramite, { ubicacion: receptor.cuenta, estado: 'EN REVISION' })

        res.json({
            ok: true,
            tramite: mail
        })
    } catch (error) {
        console.log('[SERVER]: Error (enviar tramite)', error);
        res.status(500).json({
            ok: true,
            message: 'No se pudo enviar el tramite'
        })
    }
}

const obtener_bandeja_entrada = async (req = request, res = response) => {
    const id_cuenta = req.id_cuenta
    try {
        const tramites = await BandejaEntrada.find({ receptor: id_cuenta })
            .sort({ _id: -1 })
            .populate({
                path: 'tramite',
                select: 'alterno estado',
                populate: {
                    path: 'tipo_tramite',
                    select: 'nombre -_id'
                }
            })
            .populate({
                path: 'emisor',
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
                        select: 'nombre cargo',
                    }
                ]
            })
        res.json({
            ok: true,
            tramites
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener bandeja entrada)', error);
        res.status(500).json({
            ok: true,
            message: 'error al obtener bandeja entrada'
        })
    }
}

const obtener_bandeja_salida = async (req = request, res = response) => {
    try {
        const tramites = await BandejaSalida.find({ 'emisor.cuenta': req.id_cuenta })
            .sort({ _id: -1 })
            .populate({
                path: 'tramite',
                select: 'alterno estado',
                populate: {
                    path: 'tipo_tramite',
                    select: 'nombre -_id'
                }
            })
            .populate({
                path: 'receptor.cuenta',
                select: '_id',
                populate: [
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
        res.json({
            ok: true,
            tramites
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener bandeja salida)', error);
        res.status(500).json({
            ok: true,
            message: 'Error en el servidor'
        })
    }
}




const obtener_usuarios_envio = async (req = request, res = response) => {
    const id_dependencia = req.params.id_dependencia
    try {
        const funcionarios = await Cuenta.find({ dependencia: id_dependencia })
            .select('_id')
            .populate('funcionario', 'nombre cargo')
            .populate({
                path: 'dependencia',
                select: 'nombre -_id'
            })
        res.json({
            ok: true,
            funcionarios
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener funcionarios para envio)', error);
        res.status(500).json({
            ok: true,
            message: 'error obtener funcionarios para envio'
        })
    }
}


const aceptar_tramite = async (req = request, res = response) => {
    const id_bandeja = req.params.id
    try {
        const mail = await BandejaEntrada.findByIdAndUpdate(id_bandeja, { recibido: true })
        await BandejaSalida.findOneAndUpdate({ tramite: mail.tramite, 'emisor.cuenta': mail.emisor, 'receptor.cuenta': mail.receptor, recibido: null }, { recibido: true, fecha_recibido: new Date() })
        res.json({
            ok: true,
            message: 'Tramite aceptado'
        })
    } catch (error) {
        console.log('[SERVER]: error (aceptar tramite)', error);
        res.status(500).json({
            ok: true,
            message: 'No se ha podido aceptar el tramite'
        })
    }
}

const rechazar_tramite = async (req = request, res = response) => {
    const { motivo_rechazo } = req.body
    const id_bandeja = req.params.id
    try {
        const mail = await BandejaEntrada.findById(id_bandeja)
        // BUSCAR ULTIMO ENVIO PARA DEVOLVER A SU BANDEJA DE ENTRADA
        const ultimo_envio = await BandejaSalida.findOne({ tramite: mail.tramite, 'receptor.cuenta': mail.emisor, recibido: true }).sort({ _id: -1 })
        if (ultimo_envio) {
            // si existe debe regresar a ese envio
            await BandejaEntrada.findByIdAndUpdate(id_bandeja, { emisor: ultimo_envio.emisor.cuenta, receptor: ultimo_envio.receptor.cuenta, recibido: true, motivo: ultimo_envio.motivo, cantidad: ultimo_envio.cantidad, fecha_envio: ultimo_envio.fecha_envio })
        }
        else {
            // si no existe debe eliminarse de bandeja entrada
            await BandejaEntrada.findByIdAndDelete(id_bandeja)
        }
        await BandejaSalida.findOneAndUpdate({ tramite: mail.tramite, 'emisor.cuenta': mail.emisor, 'receptor.cuenta': mail.receptor, recibido: null }, { fecha_recibido: new Date(), motivo_rechazo, recibido: false })
        await TramiteExterno.findByIdAndUpdate(mail.tramite, { ubicacion: mail.emisor })
        res.json({
            ok: true,
            message: 'Tramite rechazado'
        })
    } catch (error) {
        console.log('[SERVER]: error (rechazar tramite)', error);
        res.status(500).json({
            ok: true,
            message: 'No se ha podido rechazar el tramite'
        })
    }
}


const getDetailsMail = async (req = request, res = response) => {
    const id_bandeja = req.params.id
    try {
        const mail = await BandejaEntrada.findById(id_bandeja).select('cantidad fecha_envio motivo recibido tramite')
            .populate({
                path: 'emisor',
                select: '_id',
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
                    },
                ]
            })
        res.json({
            ok: true,
            mail
        })
    } catch (error) {
        console.log('[SERVER]: error (aceptar tramite)', error);
        res.status(500).json({
            ok: true,
            message: 'No se ha podido aceptar el tramite'
        })
    }
}






module.exports = {
    agregar_mail,
    obtener_bandeja_entrada,
    obtener_bandeja_salida,
    aceptar_tramite,
    rechazar_tramite,

    getDetailsMail,

    obtener_usuarios_envio
}