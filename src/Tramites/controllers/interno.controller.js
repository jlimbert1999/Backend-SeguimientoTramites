const router = require('express').Router()
const { request, response } = require('express');

const { ServerErrorResponde } = require('../../../helpers/responses')

const InternoService = require('../services/interno.service')
const internoService = new InternoService()

router.get('/tipos',  async (req = request, res = response) => {
    try {
        const tipos = await internoService.getTypes()
        return res.status(200).json({
            ok: true,
            tipos
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/', async (req = request, res = response) => {
    try {
        const { tramites, length } = await internoService.get(req.id_cuenta, req.query.limit, req.query.offset)
        return res.status(200).json({
            ok: true,
            tramites,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/:id',  async (req = request, res = response) => {
    try {
        const { tramite, workflow } = await internoService.getOne(req.params.id)
        return res.status(200).json({
            tramite,
            workflow
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.post('/',  async (req = request, res = response) => {
    try {
        const tramite = await internoService.add(req.body, req.id_cuenta)
        return res.status(200).json({
            tramite
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/:id',  async (req = request, res = response) => {
    try {
        const tramite = await internoService.edit(req.params.id, req.body)
        return res.status(200).json({
            tramite
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/usuarios/:text',  async (req = request, res = response) => {
    try {
        const users = await internoService.getUsers(req.params.text)
        return res.status(200).json({
            users
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/search/:text',  async (req = request, res = response) => {
    try {
        const { tramites, length } = await internoService.search(req.id_cuenta, req.query.limit, req.query.offset, req.params.text)
        return res.status(200).json({
            tramites,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

module.exports = router