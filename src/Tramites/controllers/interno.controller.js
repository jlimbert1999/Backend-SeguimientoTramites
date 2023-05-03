const router = require('express').Router()
const { request, response } = require('express');

const internoService = require('../services/interno.service')
const observationService = require('./../services/observations.sevice')
const salidaService = require('../../Bandejas/services/salida.service')
const entradaService = require('../../Bandejas/services/entrada.service')
const eventService = require('../../Tramites/services/events.service')
const archiveService = require('../../Archivos/services/archivo.service')

const { ServerErrorResponde } = require('../../../helpers/responses')
const { getProceduresTypesForRegister } = require('../../Configuraciones/services/tipos.service')
const { getPaginationParms } = require('../../../helpers/Pagintation');

router.get('/tipos', async (req = request, res = response) => {
    try {
        const typesProcedures = await getProceduresTypesForRegister('INTERNO')
        return res.status(200).json({
            ok: true,
            typesProcedures
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/', async (req = request, res = response) => {
    try {
        const { limit, offset } = getPaginationParms(req.query)
        const { tramites, length } = await internoService.get(req.id_cuenta, limit, offset)
        return res.status(200).json({
            ok: true,
            tramites,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/:id', async (req = request, res = response) => {
    try {
        const [tramite, observations, location, workflow] = await Promise.all([
            internoService.getOne(req.params.id),
            observationService.getObservationsOfProcedure(req.params.id),
            entradaService.getLocationProcedure(req.params.id),
            salidaService.getWorkflowProcedure(req.params.id)
        ])
        return res.status(200).json({
            ok: true,
            tramite,
            location,
            workflow,
            observations
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.post('/', async (req = request, res = response) => {
    try {
        const tramite = await internoService.add(req.body, req.id_cuenta)
        return res.status(200).json({
            tramite
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/:id', async (req = request, res = response) => {
    try {
        const tramite = await internoService.edit(req.params.id, req.body)
        return res.status(200).json({
            ok: true,
            tramite
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/usuarios/:text', async (req = request, res = response) => {
    try {
        const users = await internoService.getUsers(req.params.text)
        return res.status(200).json({
            users
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/search/:text', async (req = request, res = response) => {
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

router.put('/concluir/:id', async (req = request, res = response) => {
    try {
        let { descripcion } = req.body
        await Promise.all([
            internoService.concludeProcedure(req.params.id),
            archiveService.archiveProcedure(req.id_cuenta, req.id_funcionario, req.params.id, descripcion, 'tramites_internos'),
            eventService.addEventProcedure(req.params.id, req.id_funcionario, `Ha concluido el tramite debido a: ${descripcion}`, 'tramites_internos')
        ])
        return res.status(200).json({
            ok: true,
            message: 'Tramite concluido y archivado'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/cancelar/:id', async (req = request, res = response) => {
    try {
        const { descripcion } = req.body
        await Promise.all([
            internoService.cancelProcedure(req.params.id),
            eventService.addEventProcedure(req.params.id, req.id_funcionario, `Ha anulado el tramite debido a: ${descripcion}`, 'tramites_internos')
        ])
        return res.status(200).json({
            ok: true,
            message: 'Tramite anulado'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})



module.exports = router