const router = require('express').Router()
const { request, response } = require('express');

const { ServerErrorResponde } = require('../../../helpers/responses')
const externoService = require('../services/externo.service')
const { getProceduresTypesForRegister } = require('../../Configuraciones/services/tipos.service')

router.get('/types', async (req = request, res = response) => {
    try {
        const types = await getProceduresTypesForRegister('EXTERNO')
        return res.status(200).json({
            ok: true,
            types
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/', async (req = request, res = response) => {
    try {
        const { tramites, total } = await externoService.get(req.id_cuenta, req.query.limit, req.query.offset)
        return res.status(200).json({
            ok: true,
            tramites,
            total
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/:id', async (req = request, res = response) => {
    try {
        const { tramite, workflow, location } = await externoService.getOne(req.params.id)
        return res.status(200).json({
            tramite,
            location,
            workflow
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/search/:text', async (req = request, res = response) => {
    try {
        const { tramites, total } = await externoService.search(req.params.text, req.query.limit, req.query.offset, req.id_cuenta)
        return res.status(200).json({
            tramites,
            total
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.post('/', async (req = request, res = response) => {
    try {
        const tramite = await externoService.add(req.id_cuenta, req.body.tramite, req.body.solicitante, req.body.representante)
        return res.status(200).json({
            tramite: {}
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/:id', async (req = request, res = response) => {
    try {
        const tramite = await externoService.edit(req.params.id, req.body)
        return res.status(200).json({
            ok: true,
            tramite
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/observacion/:id', async (req = request, res = response) => {
    try {
        const data = req.body
        const observations = await externoService.addObservacion(req.params.id, { cuenta: req.id_cuenta, ...data })
        return res.status(200).json({
            ok: true,
            observations
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})


router.put('/conclude/:id', async (req = request, res = response) => {
    try {
        let { descripcion } = req.body
        await externoService.concludeProcedure(req.params.id, descripcion, req.id_funcionario, req.id_dependencia)
        return res.status(200).json({
            ok: true,
            message: 'Tramite concluido y archivado'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/cancel/:id', async (req = request, res = response) => {
    try {
        const { descripcion } = req.body
        await externoService.cancelProcedure(req.params.id, req.id_funcionario, descripcion)
        return res.status(200).json({
            ok: true,
            message: 'Tramite anulado'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})


module.exports = router