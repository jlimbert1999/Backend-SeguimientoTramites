const router = require('express').Router()
const { request, response } = require('express');
const { ServerErrorResponde } = require('../../../helpers/responses')

const entradaService = require('../services/entrada.service')
const archivoService = require('../../Archivos/services/archivo.service')


// ENTRADAS
router.get('/', async (req = request, res = response) => {
    try {
        const { limit, offset } = req.query
        const { mails, length } = await entradaService.get(req.id_cuenta, limit, offset)
        return res.status(200).json({
            mails,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.post('/', async (req = request, res = response) => {
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
router.get('/users/:text', async (req = request, res = response) => {
    try {
        const cuentas = await entradaService.searchAccountsForSend(req.params.text, req.id_cuenta)
        return res.status(200).json({
            cuentas
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/:id', async (req = request, res = response) => {
    try {
        const { imbox, allDataProcedure } = await entradaService.getDetailsOfMail(req.params.id)
        return res.status(200).json({
            ok: true,
            imbox,
            allDataProcedure
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/search/:type', async (req = request, res = response) => {
    try {
        if (!req.params.type) {
            return res.status(400).json({
                ok: false,
                message: 'Seleccione el tipo de busqueda a realizar INTERNOS / EXTERNOS'
            })
        }
        const { mails, length } = await entradaService.search(req.id_cuenta, req.query.text, req.params.type, req.query.offset, req.query.limit)
        return res.status(200).json({
            mails,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})




// CONTROL DE FLUJO
router.put('/aceptar/:id', async (req = request, res = response) => {
    try {
        await entradaService.acept(req.params.id)
        return res.status(200).json({
            message: 'Tramite aceptado'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/rechazar/:id', async (req = request, res = response) => {
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

router.put('/concluir/:id', async (req = request, res = response) => {
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








module.exports = router