const router = require('express').Router()
const { request, response } = require('express');

const { ServerErrorResponde } = require('../../../helpers/responses')

const TipoService = require('../services/tipos.service')
const tipoService = new TipoService()


router.post('/tipos',  async (req = request, res = response) => {
    try {
        const institucion = await tipoService.add(req.body)
        return res.status(200).json({
            institucion
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/tipos',  async (req = request, res = response) => {
    try {
        const { tipos, length } = await tipoService.get(req.query.limit, req.query.offset)
        return res.status(200).json({
            tipos,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/tipos/search/:text',  async (req = request, res = response) => {
    try {
        const { tipos, length } = await tipoService.search(req.query.limit, req.query.offset, req.params.text)
        return res.status(200).json({
            tipos,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/tipos/:id',  async (req = request, res = response) => {
    try {
        const tipo = await tipoService.edit(req.params.id, req.body)
        return res.status(200).json({
            ok: true,
            tipo
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.delete('/tipos/:id',  async (req = request, res = response) => {
    try {
        const tipo = await tipoService.delete(req.params.id)
        return res.status(200).json({
            ok: true,
            tipo
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/tipos/requerimientos/:id_tipo/:id_requisito',  async (req = request, res = response) => {
    try {
        const { nombre } = req.body
        const requisito = await tipoService.editRequirements(req.params.id_tipo, req.params.id_requisito, nombre)
        return res.status(200).json({
            ok: true,
            requisito
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.delete('/tipos/requerimientos/:id_tipo/:id_requisito',  async (req = request, res = response) => {
    try {
        const requisito = await tipoService.deleteRequirements(req.params.id_tipo, req.params.id_requisito)
        return res.status(200).json({
            ok: true,
            requisito
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})


module.exports = router