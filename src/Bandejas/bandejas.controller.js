const router = require('express').Router()
const { request, response } = require('express');

const { verificarToken } = require('../../middlewares/jwt');
const { ServerErrorResponde } = require('../../helpers/responses')

const EntradaService = require('./services/entrada.service')
const SalidaService = require('./services/salida.service');
const ArchivoService = require('../Archivos/services/archivo.service')
const entradaService = new EntradaService();
const salidaService = new SalidaService();
const archivoService = new ArchivoService();

// ENTRADAS
router.get('/entrada', verificarToken, async (req = request, res = response) => {
    try {
        const { mails, length } = await entradaService.get(req.id_cuenta)
        return res.status(200).json({
            mails,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.post('/entrada', verificarToken, async (req = request, res = response) => {
    try {
        let { receptores, ...data } = req.body
        const MailsDB = await entradaService.add(receptores, data, req.id_cuenta, req.id_funcionario)
        return res.status(200).json({
            mails: MailsDB
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/entrada/users/:text', verificarToken, async (req = request, res = response) => {
    try {
        const cuentas = await entradaService.getAccounts(req.params.text, req.id_cuenta)
        return res.status(200).json({
            cuentas
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})



// SALIDAS
router.get('/salida', verificarToken, async (req = request, res = response) => {
    try {
        const { mails, length } = await salidaService.get(req.id_cuenta, req.query.limit, req.query.offset)
        return res.status(200).json({
            mails,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.delete('/salida/:id', verificarToken, async (req = request, res = response) => {
    try {
        const message = await salidaService.cancel(req.params.id, req.id_cuenta)
        return res.status(200).json({
            message
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})


// CONTROL DE FLUJO
router.put('/aceptar/:id', verificarToken, async (req = request, res = response) => {
    try {
        const message = await entradaService.acept(req.params.id)
        return res.status(200).json({
            message
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/rechazar/:id', verificarToken, async (req = request, res = response) => {
    try {
        let { motivo_rechazo } = req.body
        const message = await entradaService.decline(req.params.id, motivo_rechazo)
        return res.status(200).json({
            message
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.put('/concluir/:id', verificarToken, async (req = request, res = response) => {
    try {
        let { descripcion } = req.body
        const mail = await entradaService.conclude(req.params.id, req.id_funcionario, descripcion)
        await archivoService.archiveMail(mail, req.id_funcionario, req.id_dependencia, descripcion)
        return res.status(200).json({
            message: 'Tramite cocluido'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})


router.get('/search/:text', verificarToken, async (req = request, res = response) => {
    try {
        const { mails, length } = await entradaService.search(req.id_cuenta, req.params.text, req.query.type, req.query.offset, req.query.limit)
        return res.status(200).json({
            mails,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})








module.exports = router