const router = require('express').Router()
const { request, response } = require('express');

const externoService = require('../services/externo.service')
const { ServerErrorResponde } = require('../../../helpers/responses')
const { getPaginationParams } = require('../../../helpers/Pagintation');

const { getObservationsOfProcedure } = require('./../services/observations.sevice')
const { getEventsOfProcedure, addEventProcedure } = require('../services/events.service')
const { getProceduresTypesForRegister } = require('../../Configuraciones/services/tipos.service')
const { archiveProcedure } = require('../../Archivos/services/archivo.service');
const { getLocationProcedure } = require('../../Bandejas/services/entrada.service')
const { getWorkflowProcedure } = require('../../Bandejas/services/salida.service');
const verifyRole = require('../../../middlewares/verifyRole');


router.get('/tipos', verifyRole('externos'), async (req = request, res = response) => {
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
router.get('/', verifyRole('externos'), async (req = request, res = response) => {
    try {
        const { limit, offset } = getPaginationParams(req.query)
        const { tramites, total } = await externoService.get(req.id_cuenta, limit, offset)
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
        const [tramite, observations, location, workflow, events] = await Promise.all([
            externoService.getOne(req.params.id),
            getObservationsOfProcedure(req.params.id),
            getLocationProcedure(req.params.id),
            getWorkflowProcedure(req.params.id),
            getEventsOfProcedure(req.params.id)
        ])
        return res.status(200).json({
            ok: true,
            tramite,
            location,
            workflow,
            observations,
            events
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/buscar/:text', verifyRole('externos'), async (req = request, res = response) => {
    try {
        const { limit, offset } = getPaginationParams(req.query)
        const { tramites, length } = await externoService.search(req.params.text, limit, offset, req.id_cuenta)
        return res.status(200).json({
            ok: true,
            tramites,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.post('/', verifyRole('externos'), async (req = request, res = response) => {
    try {
        const tramite = await externoService.add(req.id_cuenta, req.body.tramite, req.body.solicitante, req.body.representante)
        return res.status(200).json({
            tramite
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/:id', verifyRole('externos'), async (req = request, res = response) => {
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

router.put('/concluir/:id', verifyRole('externos'), async (req = request, res = response) => {
    try {
        let { descripcion } = req.body
        await Promise.all([
            externoService.concludeProcedure(req.params.id),
            archiveProcedure(req.id_cuenta, req.id_funcionario, req.params.id, descripcion, 'tramites_externos'),
            addEventProcedure(req.params.id, req.id_funcionario, `Ha concluido el tramite debido a: ${descripcion}`, 'tramites_externos')
        ])
        return res.status(200).json({
            ok: true,
            message: 'Tramite concluido y archivado'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/cancelar/:id', verifyRole('externos'), async (req = request, res = response) => {
    try {
        const { descripcion } = req.body
        await Promise.all([
            externoService.cancelProcedure(req.params.id),
            addEventProcedure(req.params.id, req.id_funcionario, `Ha anulado el tramite debido a: ${descripcion}`, 'tramites_externos')
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