const BandejaEntrada = require('./bandeja-entrada.model')
const BandejaSalida = require('./bandeja-salida.model')
const Cuenta = require('../../componentes/cuentas/cuenta.model')
const { TramiteExterno } = require('../../seguimiento/tramites/tramite.model')

const { request, response } = require('express')

const agregar_mail = async (req = request, res = response) => {
    let { mail_entrada, mail_salida, mail_reenvio, estado } = req.body
    const id_cuenta = req.id_cuenta
    const id_tramite = mail_entrada.tramite
    mail_entrada.recibido = false
    mail_entrada.cuenta_emisor = mail_salida.cuenta_emisor = id_cuenta
    mail_entrada.fecha_envio = mail_salida.fecha_envio = new Date()
    try {
        if (mail_reenvio) {
            // marcar el antiguo tramite rechazado como reenviado
            await BandejaSalida.findOneAndUpdate({ tramite: id_tramite, cuenta_emisor: mail_reenvio.cuenta_emisor, cuenta_receptor: mail_reenvio.cuenta_receptor, recibido: false, reenviado: false }, { reenviado: true })
        }
        const nuevoMailEntrada = await BandejaEntrada.findOneAndUpdate({ tramite: id_tramite }, mail_entrada, { upsert: true, new: true })
        const nuevoMailSalida = new BandejaSalida(mail_salida)
        await nuevoMailSalida.save()
        await TramiteExterno.findByIdAndUpdate(id_tramite, { ubicacion: mail_entrada.cuenta_receptor, estado: 'EN REVISION' })
        res.json({
            ok: true,
            tramite: nuevoMailEntrada
        })
    } catch (error) {
        console.log('[SERVER]: error (enviar tramite)', error);
        res.status(500).json({
            ok: true,
            message: 'error al enviar tramite'
        })
    }
}

const obtener_bandeja_entrada = async (req = request, res = response) => {
    const id_cuenta = req.id_cuenta
    try {
        const tramites = await BandejaEntrada.find({ cuenta_receptor: id_cuenta })
            .populate({
                path: 'tramite',
                select: 'alterno estado',
                populate: {
                    path: 'tipo_tramite',
                    select: 'nombre -_id'
                }
            })
            .populate({
                path: 'cuenta_emisor',
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
    const id_cuenta = req.id_cuenta
    try {
        const tramites = await BandejaSalida.find({ cuenta_emisor: id_cuenta })
            .populate({
                path: 'tramite',
                select: 'alterno estado',
                populate: {
                    path: 'tipo_tramite',
                    select: 'nombre -_id'
                }
            })
            .populate({
                path: 'cuenta_receptor',
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
            }).populate('funcionario_receptor.funcionario', 'nombre')
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
    const id_tramite = req.params.id_tramite
    const cuenta_receptor = req.id_cuenta
    const { cuenta_emisor } = req.body
    try {
        await BandejaEntrada.findOneAndUpdate({ tramite: id_tramite }, { recibido: true })
        await BandejaSalida.findOneAndUpdate({ tramite: id_tramite, cuenta_emisor, cuenta_receptor, recibido: undefined, reenviado: false }, { recibido: true, fecha_recibido: new Date() })
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
    const id_tramite = req.params.id_tramite
    const cuenta_receptor = req.id_cuenta
    const { cuenta_emisor, motivo_rechazo } = req.body
    try {
        // condicional recibido: undefined revisar
        await BandejaEntrada.findOneAndDelete({ tramite: id_tramite })
        await BandejaSalida.findOneAndUpdate({ tramite: id_tramite, cuenta_emisor, cuenta_receptor, recibido: undefined, reenviado: false }, { recibido: false, fecha_recibido: new Date(), motivo_rechazo })
        await TramiteExterno.findByIdAndUpdate(id_tramite, { ubicacion: cuenta_emisor })
        res.json({
            ok: true,
            message: 'Se rechazo el tramite'
        })
    } catch (error) {
        console.log('[SERVER]: error (rechazar tramite)', error);
        res.status(500).json({
            ok: true,
            message: 'No se ha podido rechazar el tramite'
        })
    }
}





module.exports = {
    agregar_mail,
    obtener_bandeja_entrada,
    obtener_bandeja_salida,
    aceptar_tramite,
    rechazar_tramite,

    obtener_usuarios_envio
}