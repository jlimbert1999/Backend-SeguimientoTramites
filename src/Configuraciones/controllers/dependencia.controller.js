const router = require('express').Router()
const { request, response } = require('express');

const { ServerErrorResponde } = require('../../../helpers/responses')

const dependenciaService = require('../services/dependencias.service')
const institutionService = require('../services/instituciones.service')

router.post('', async (req = request, res = response) => {
    try {
        const dependencia = await dependenciaService.add(req.body)
        return res.status(200).json({
            dependencia
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/instituciones', async (req = request, res = response) => {
    try {
        const instituciones = await institutionService.getActiveIntituciones()
        return res.status(200).json({
            instituciones
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('', async (req = request, res = response) => {
    try {
        const { dependencias, length } = await dependenciaService.get(req.query.limit, req.query.offset)
        return res.status(200).json({
            dependencias,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/search/:text', async (req = request, res = response) => {
    try {
        const { dependencias, length } = await dependenciaService.search(req.query.limit, req.query.offset, req.params.text)
        return res.status(200).json({
            dependencias,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/:id', async (req = request, res = response) => {
    try {
        const dependencia = await dependenciaService.edit(req.params.id, req.body)
        return res.status(200).json({
            ok: true,
            dependencia
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.delete('/:id', async (req = request, res = response) => {
    try {
        const dependencia = await dependenciaService.delete(req.params.id)
        return res.status(200).json({
            ok: true,
            dependencia
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

module.exports = router