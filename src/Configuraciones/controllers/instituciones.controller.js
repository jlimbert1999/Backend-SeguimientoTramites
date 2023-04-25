const router = require('express').Router()
const { request, response } = require('express');

const { ServerErrorResponde } = require('../../../helpers/responses')
const institucionService = require('../services/instituciones.service')

router.post('', async (req = request, res = response) => {
    try {
        const institucion = await institucionService.add(req.body)
        return res.status(200).json({
            institucion
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('', async (req = request, res = response) => {
    try {
        const { instituciones, length } = await institucionService.get(req.query.limit, req.query.offset)
        return res.status(200).json({
            instituciones,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/search/:text', async (req = request, res = response) => {
    try {
        const { instituciones, length } = await institucionService.search(req.query.limit, req.query.offset, req.params.text)
        return res.status(200).json({
            instituciones,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/:id', async (req = request, res = response) => {
    try {
        const institucion = await institucionService.edit(req.params.id, req.body)
        return res.status(200).json({
            ok: true,
            institucion
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.delete('/:id', async (req = request, res = response) => {
    try {
        const institucion = await institucionService.delete(req.params.id)
        return res.status(200).json({
            ok: true,
            institucion
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

module.exports = router
