const router = require('express').Router()
const { request, response, json } = require('express');
const { verificarToken } = require('../../middlewares/jwt');
const { ServerErrorResponde } = require('../../helpers/responses')
const InstitucionService = require('./services/instituciones.service')
const DependenciaService = require('./services/dependencias.service')
const TipoService = require('./services/tipos.service')
const institucionService = new InstitucionService()
const dependenciaService = new DependenciaService()
const tipoService = new TipoService()

// INSTITUCIONES
router.post('/instituciones', verificarToken, async (req = request, res = response) => {
    try {
        const institucion = await institucionService.add(req.body)
        return res.status(200).json({
            institucion
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/instituciones', verificarToken, async (req = request, res = response) => {
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
router.get('/instituciones/search/:text', verificarToken, async (req = request, res = response) => {
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
router.put('/instituciones/:id', verificarToken, async (req = request, res = response) => {
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
router.delete('/instituciones/:id', verificarToken, async (req = request, res = response) => {
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

// DEPENDENCIAS
router.post('/dependencias', verificarToken, async (req = request, res = response) => {
    try {
        const dependencia = await dependenciaService.add(req.body)
        return res.status(200).json({
            dependencia
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/dependencias/instituciones', verificarToken, async (req = request, res = response) => {
    try {
        const instituciones = await dependenciaService.getInstituciones()
        return res.status(200).json({
            instituciones
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/dependencias', verificarToken, async (req = request, res = response) => {
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
router.get('/dependencias/search/:text', verificarToken, async (req = request, res = response) => {
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
router.put('/dependencias/:id', verificarToken, async (req = request, res = response) => {
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
router.delete('/dependencias/:id', verificarToken, async (req = request, res = response) => {
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

// TIPOS DE TRAMITES
router.post('/tipos', verificarToken, async (req = request, res = response) => {
    try {
        const institucion = await tipoService.add(req.body)
        return res.status(200).json({
            institucion
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/tipos', verificarToken, async (req = request, res = response) => {
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
router.get('/tipos/search/:text', verificarToken, async (req = request, res = response) => {
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
router.put('/tipos/:id', verificarToken, async (req = request, res = response) => {
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
router.delete('/tipos/:id', verificarToken, async (req = request, res = response) => {
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
router.put('/tipos/requerimientos/:id_tipo/:id_requisito', verificarToken, async (req = request, res = response) => {
    try {
        const tipo = await tipoService.editRequirements(req.params.id_tipo, req.params.id_requisito, req.body)
        return res.status(200).json({
            ok: true,
            tipo
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})








module.exports = router