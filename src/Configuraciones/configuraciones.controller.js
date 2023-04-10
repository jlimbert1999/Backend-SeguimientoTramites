const router = require('express').Router()
const { request, response, json, text } = require('express');
const verifyToken = require('../../middlewares/verifyToken');

const { ServerErrorResponde } = require('../../helpers/responses')
const InstitucionService = require('./services/instituciones.service')
const DependenciaService = require('./services/dependencias.service')
const TipoService = require('./services/tipos.service')
const FuncionarioService = require('./services/funcionarios.service')
const CuentaService = require('../Configuraciones/services/cuentas.service')
const RolService = require('../Configuraciones/services/roles.service')

const institucionService = new InstitucionService()
const dependenciaService = new DependenciaService()
const tipoService = new TipoService()
const funcionarioService = new FuncionarioService()
const cuentaService = new CuentaService()
const rolService = new RolService()

// INSTITUCIONES
router.post('/instituciones', verifyToken, async (req = request, res = response) => {
    try {
        const institucion = await institucionService.add(req.body)
        return res.status(200).json({
            institucion
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/instituciones', verifyToken, async (req = request, res = response) => {
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
router.get('/instituciones/search/:text', verifyToken, async (req = request, res = response) => {
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
router.put('/instituciones/:id', verifyToken, async (req = request, res = response) => {
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
router.delete('/instituciones/:id', verifyToken, async (req = request, res = response) => {
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
router.post('/dependencias', verifyToken, async (req = request, res = response) => {
    try {
        const dependencia = await dependenciaService.add(req.body)
        return res.status(200).json({
            dependencia
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/dependencias/instituciones', verifyToken, async (req = request, res = response) => {
    try {
        const instituciones = await dependenciaService.getInstituciones()
        return res.status(200).json({
            instituciones
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/dependencias', verifyToken, async (req = request, res = response) => {
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
router.get('/dependencias/search/:text', verifyToken, async (req = request, res = response) => {
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
router.put('/dependencias/:id', verifyToken, async (req = request, res = response) => {
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
router.delete('/dependencias/:id', verifyToken, async (req = request, res = response) => {
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
router.post('/tipos', verifyToken, async (req = request, res = response) => {
    try {
        const institucion = await tipoService.add(req.body)
        return res.status(200).json({
            institucion
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/tipos', verifyToken, async (req = request, res = response) => {
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
router.get('/tipos/search/:text', verifyToken, async (req = request, res = response) => {
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
router.put('/tipos/:id', verifyToken, async (req = request, res = response) => {
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
router.delete('/tipos/:id', verifyToken, async (req = request, res = response) => {
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
router.put('/tipos/requerimientos/:id_tipo/:id_requisito', verifyToken, async (req = request, res = response) => {
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
router.delete('/tipos/requerimientos/:id_tipo/:id_requisito', verifyToken, async (req = request, res = response) => {
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

//FUNCIONARIOS
router.post('/funcionarios', verifyToken, async (req = request, res = response) => {
    try {
        const funcionario = await funcionarioService.add(req.body)
        return res.status(200).json({
            funcionario
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/funcionarios', verifyToken, async (req = request, res = response) => {
    try {
        const { funcionarios, length } = await funcionarioService.get(req.query.limit, req.query.offset)
        return res.status(200).json({
            funcionarios,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/funcionarios/search/:text', verifyToken, async (req = request, res = response) => {
    try {
        const { funcionarios, length } = await funcionarioService.search(req.query.limit, req.query.offset, req.params.text)
        return res.status(200).json({
            funcionarios,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/funcionarios/organizacion/:id', async (req = request, res = response) => {
    try {
        const funcionarios = await funcionarioService.getOrganization(req.params.id)
        return res.status(200).json({
            funcionarios,

        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/funcionarios/search-one/:text', verifyToken, async (req = request, res = response) => {
    try {
        const funcionarios = await funcionarioService.searchOne(req.params.text, req.id_funcionario)
        return res.status(200).json({
            ok: true,
            funcionarios
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/funcionarios/:id', verifyToken, async (req = request, res = response) => {
    try {
        const funcionario = await funcionarioService.edit(req.params.id, req.body)
        return res.status(200).json({
            ok: true,
            funcionario
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.delete('/funcionarios/:id', verifyToken, async (req = request, res = response) => {
    try {
        const funcionario = await funcionarioService.delete(req.params.id)
        return res.status(200).json({
            ok: true,
            funcionario
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

//CUENTAS
router.get('/cuentas/roles', verifyToken, async (req = request, res = response) => {
    try {
        const roles = await cuentaService.getRoles()
        return res.status(200).json({
            roles
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/cuentas/dependencias/:id_institucion', verifyToken, async (req = request, res = response) => {
    try {
        const dependencias = await cuentaService.getDependencias(req.params.id_institucion)
        return res.status(200).json({
            dependencias
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/cuentas/funcionarios/:text', verifyToken, async (req = request, res = response) => {
    try {
        const funcionarios = await cuentaService.getUserAssign(req.params.text)
        return res.status(200).json({
            funcionarios
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/cuentas', async (req = request, res = response) => {
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
router.put('/cuentas/:id', verifyToken, async (req = request, res = response) => {
    try {
        const { cuentas, length } = await cuentaService.edit(req.params.id, req.body.login, req.body.password, req.body.rol)
        return res.status(200).json({
            cuentas,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/cuentas/details/:id', verifyToken, async (req = request, res = response) => {
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
router.post('/cuentas', verifyToken, async (req = request, res = response) => {
    try {
        const cuenta = await cuentaService.add(req.body.cuenta, req.body.funcionario)
        return res.status(200).json({
            cuenta
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/cuentas/search', verifyToken, async (req = request, res = response) => {
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
router.put('/funcionarios/:id', verifyToken, async (req = request, res = response) => {
    // try {
    //     const funcionario = await funcionarioService.edit(req.params.id, req.body)
    //     return res.status(200).json({
    //         ok: true,
    //         funcionario
    //     })
    // } catch (error) {
    //     ServerErrorResponde(error, res)
    // }
})
router.delete('/funcionarios/:id', verifyToken, async (req = request, res = response) => {
    // try {
    //     const funcionario = await funcionarioService.delete(req.params.id)
    //     return res.status(200).json({
    //         ok: true,
    //         funcionario
    //     })
    // } catch (error) {
    //     ServerErrorResponde(error, res)
    // }
})

// ROLES
router.post('/roles', verifyToken, async (req = request, res = response) => {
    try {
        const Rol = await rolService.add(req.body)
        return res.status(200).json({
            Rol
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/roles', verifyToken, async (req = request, res = response) => {
    try {
        const Roles = await rolService.get()
        return res.status(200).json({
            Roles
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/roles/:id', verifyToken, async (req = request, res = response) => {
    try {
        const Rol = await rolService.edit(req.body, req.params.id)
        return res.status(200).json({
            Rol
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})



module.exports = router