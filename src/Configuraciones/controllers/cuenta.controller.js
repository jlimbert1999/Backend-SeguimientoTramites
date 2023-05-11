const router = require('express').Router()
const { request, response } = require('express');
const { ServerErrorResponde } = require('../../../helpers/responses')

const cuentaService = require('../services/cuentas.service')
const institutionService = require('../services/instituciones.service')
const dependencieService = require('../services/dependencias.service')

router.get('/roles', async (req = request, res = response) => {
    try {
        const roles = await cuentaService.getRoles()
        return res.status(200).json({
            roles
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

router.get('/dependencias/:id_institucion', async (req = request, res = response) => {
    try {
        const dependencias = await dependencieService.getDependenciesOfInstitucion(req.params.id_institucion)
        return res.status(200).json({
            dependencias
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/funcionarios/:text', async (req = request, res = response) => {
    try {
        const funcionarios = await cuentaService.getUserAssign(req.params.text)
        return res.status(200).json({
            funcionarios
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/', async (req = request, res = response) => {
    try {
        const { cuentas, length } = await cuentaService.get(req.query.limit, req.query.offset)
        return res.status(200).json({
            cuentas,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/:id', async (req = request, res = response) => {
    try {
        const cuenta = await cuentaService.edit(req.params.id, req.body)
        return res.status(200).json({
            cuenta
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/details/:id', async (req = request, res = response) => {
    try {
        const details = await cuentaService.getDetails(req.params.id)
        return res.status(200).json({
            ok: true,
            details
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.post('', async (req = request, res = response) => {
    try {
        const cuenta = await cuentaService.add(req.body.cuenta, req.body.funcionario)
        return res.status(200).json({
            cuenta
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.delete('/:id', async (req = request, res = response) => {
    try {
        const activo = await cuentaService.delete(req.params.id)
        return res.status(200).json({
            ok: true,
            activo
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/search', async (req = request, res = response) => {
    try {
        const { cuentas, length } = await cuentaService.search(req.query.limit, req.query.offset, req.query.text, req.query.institucion, req.query.dependencia)
        return res.status(200).json({
            ok: true,
            cuentas,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.put('/unlink/:id', async (req = request, res = response) => {
    try {
        const message = await cuentaService.unlinkUser(req.params.id)
        return res.status(200).json({
            ok: true,
            message
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.put('/link/:id', async (req = request, res = response) => {
    try {
        const message = await cuentaService.assignUser(req.params.id, req.body.id_oldUser, req.body.id_newUser)
        return res.status(200).json({
            ok: true,
            message
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.post('/link', async (req = request, res = response) => {
    try {
        const { cuenta, id_funcionario } = req.body
        const cuentadb = await cuentaService.addAccountLink(cuenta, id_funcionario)
        return res.status(200).json({
            ok: true,
            cuenta: cuentadb
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

module.exports = router