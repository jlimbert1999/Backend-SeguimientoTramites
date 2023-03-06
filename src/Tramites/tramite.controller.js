const router = require('express').Router()
const { request, response, json } = require('express');
const { verificarToken } = require('../../middlewares/jwt');

const ExternoService = require('./services/externo.service')
const InternoService = require('./services/interno.service')
const externoService = new ExternoService();
const internoService = new InternoService()

const { ServerErrorResponde } = require('../../helpers/responses')

// EXTERNOS
router.get('/externos/segmentos', verificarToken, async (req = request, res = response) => {
    try {
        const groups = await externoService.getGroupsTypes(req.params.segmento)
        return res.status(200).json({
            groups
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/externos', verificarToken, async (req = request, res = response) => {
    try {
        const { tramites, total } = await externoService.get(req.id_cuenta, req.query.limit, req.query.offset)
        return res.status(200).json({
            tramites,
            total
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/externos/:id', verificarToken, async (req = request, res = response) => {
    try {
        const { tramite, workflow } = await externoService.getOne(req.params.id)
        return res.status(200).json({
            tramite,
            workflow
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/externos/search/:text', verificarToken, async (req = request, res = response) => {
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
router.get('/externos/tipos/:segmento', verificarToken, async (req = request, res = response) => {
    try {
        const tipos = await externoService.getTypes(req.params.segmento)
        return res.status(200).json({
            tipos
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.post('/externos', verificarToken, async (req = request, res = response) => {
    try {
        const tramite = await externoService.add(req.id_cuenta, req.body.tramite, req.body.solicitante, req.body.representante)
        return res.status(200).json({
            tramite
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/externos/:id', verificarToken, async (req = request, res = response) => {
    try {
        const tramite = await externoService.edit(req.params.id, req.body.tramite, req.body.solicitante, req.body.representante)
        return res.status(200).json({
            tramite
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/externos/concluir/:id', verificarToken, async (req = request, res = response) => {
    try {
        let { descripcion } = req.body
        const message = await externoService.concludeInit(req.params.id, descripcion, req.id_funcionario)
        return res.status(200).json({
            message
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})




// INTERNOS
router.get('/internos/tipos', verificarToken, async (req = request, res = response) => {
    try {
        const tipos = await internoService.getTypes()
        return res.status(200).json({
            tipos
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/internos', verificarToken, async (req = request, res = response) => {
    try {
        const { tramites, length } = await internoService.get(req.id_cuenta, req.query.limit, req.query.offset)
        return res.status(200).json({
            tramites,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/internos/:id', verificarToken, async (req = request, res = response) => {
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

router.post('/internos', verificarToken, async (req = request, res = response) => {
    try {
        const tramite = await internoService.add(req.body, req.id_cuenta)
        return res.status(200).json({
            tramite
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/internos/:id', verificarToken, async (req = request, res = response) => {
    try {
        const tramite = await internoService.edit(req.params.id, req.body)
        return res.status(200).json({
            tramite
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/internos/usuarios/:text', verificarToken, async (req = request, res = response) => {
    try {
        const users = await internoService.getUsers(req.params.text)
        return res.status(200).json({
            users
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/internos/search/:text', verificarToken, async (req = request, res = response) => {
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