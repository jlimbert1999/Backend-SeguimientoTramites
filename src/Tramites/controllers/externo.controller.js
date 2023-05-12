const router = require('express').Router()
const { request, response } = require('express');

const externoService = require('../services/externo.service')
const { ServerErrorResponde } = require('../../../helpers/responses')
const { getPaginationParams } = require('../../../helpers/Pagintation');
const { addEventProcedure } = require('../services/events.service')
const { getProceduresTypesForRegister } = require('../../Configuraciones/services/tipos.service')
const { archiveProcedure } = require('../../Archivos/services/archivo.service');


router.get('/tipos', async (req = request, res = response) => {
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
router.get('/buscar/:text', async (req = request, res = response) => {
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

router.post('/', async (req = request, res = response) => {
    try {
        const tramite = await externoService.add(req.id_cuenta, req.body.tramite, req.body.solicitante, req.body.representante)
        return res.status(200).json({
            tramite
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

router.put('/concluir/:id', async (req = request, res = response) => {
    try {
        let { descripcion } = req.body
        await Promise.all([
            externoService.concludeProcedure(req.params.id),
            archiveProcedure(req.id_cuenta, req.id_funcionario, req.params.id, descripcion, 'tramites_externos'),
            addEventProcedure(req.params.id, req.id_funcionario, descripcion, 'tramites_externos')
        ])
        return res.status(200).json({
            ok: true,
            message: 'Tramite concluido y archivado'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
// router.put('/cancelar/:id', async (req = request, res = response) => {
//     try {
//         const { descripcion } = req.body
//         await Promise.all([
//             externoService.cancelProcedure(req.params.id),
//             addEventProcedure(req.params.id, req.id_funcionario, `Ha anulado el tramite debido a: ${descripcion}`, 'tramites_externos')
//         ])
//         return res.status(200).json({
//             ok: true,
//             message: 'Tramite anulado'
//         })
//     } catch (error) {
//         ServerErrorResponde(error, res)
//     }
// })


module.exports = router