const router = require('express').Router()
const { request, response } = require('express');

const { verificarToken } = require('../../middlewares/jwt');
const { ServerErrorResponde } = require('../../helpers/responses')

const EntradaService = require('./services/entrada.service')
const SalidaService = require('./services/salida.service');
const entradaService = new EntradaService();
const salidaService = new SalidaService();

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





module.exports = router