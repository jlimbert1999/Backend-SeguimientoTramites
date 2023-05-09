const router = require('express').Router()
const { request, response } = require('express');
const { ServerErrorResponde } = require('../../../helpers/responses')
const { getPaginationParams } = require('../../../helpers/Pagintation')
const salidaService = require('../services/salida.service');

router.get('/', async (req = request, res = response) => {
    try {
        const { limit, offset } = getPaginationParams(req.query)
        const { mails, length } = await salidaService.get(req.id_cuenta, limit, offset)
        return res.status(200).json({
            mails,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.delete('/:id', async (req = request, res = response) => {
    try {
        const message = await salidaService.cancelOneSend(req.params.id)
        return res.status(200).json({
            ok: true,
            message
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/all/:id_tramite', async (req = request, res = response) => {
    try {
        const { fecha_envio } = req.body
        const message = await salidaService.cancelAllSend(req.id_cuenta, req.params.id_tramite, fecha_envio)
        return res.status(200).json({
            ok: true,
            message
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/search/:type', async (req = request, res = response) => {
    try {
        const { limit, offset } = getPaginationParams(req.query)
        const { mails, length } = await salidaService.search(req.id_cuenta, req.query.text, req.params.type, offset, limit)
        return res.status(200).json({
            mails,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
module.exports = router
