const router = require('express').Router()
const { request, response } = require('express');

const internoService = require('../services/interno.service')
const { ServerErrorResponde } = require('../../../helpers/responses')
const { getPaginationParams } = require('../../../helpers/Pagintation');

const { getProceduresTypesForRegister } = require('../../Configuraciones/services/tipos.service')
const { getOfficerByText } = require('../../Configuraciones/services/funcionarios.service')
const { archiveProcedure } = require('../../Archivos/services/archivo.service')
const { addEventProcedure } = require('../../Tramites/services/events.service')

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
        const { limit, offset } = getPaginationParams(req.query)
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
        const users = await getOfficerByText(req.params.text)
        return res.status(200).json({
            users
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/search/:text', async (req = request, res = response) => {
    try {
        const { limit, offset } = getPaginationParams(req.query)
        const { tramites, length } = await internoService.search(req.id_cuenta, limit, offset, req.params.text)
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
            archiveProcedure(req.id_cuenta, req.id_funcionario, req.params.id, descripcion, 'tramites_internos'),
            addEventProcedure(req.params.id, req.id_funcionario, `Ha concluido el tramite debido a: ${descripcion}`, 'tramites_internos')
        ])
        return res.status(200).json({
            ok: true,
            message: 'Tramite concluido y archivado'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})


module.exports = router