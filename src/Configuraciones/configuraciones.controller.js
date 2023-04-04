const router = require('express').Router()
const { request, response, json, text } = require('express');
const { verificarToken } = require('../../middlewares/jwt');

const { ServerErrorResponde } = require('../../helpers/responses')
const InstitucionService = require('./services/instituciones.service')
const DependenciaService = require('./services/dependencias.service')
const TipoService = require('./services/tipos.service')
const FuncionarioService = require('./services/funcionarios.service')
const CuentaService = require('../Configuraciones/services/cuentas.service')

const institucionService = new InstitucionService()
const dependenciaService = new DependenciaService()
const tipoService = new TipoService()
const funcionarioService = new FuncionarioService()
const cuentaService = new CuentaService()

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
router.delete('/tipos/requerimientos/:id_tipo/:id_requisito', verificarToken, async (req = request, res = response) => {
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
router.post('/funcionarios', verificarToken, async (req = request, res = response) => {
    try {
        const funcionario = await funcionarioService.add(req.body)
        return res.status(200).json({
            funcionario
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/funcionarios', verificarToken, async (req = request, res = response) => {
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
router.get('/funcionarios/search/:text', verificarToken, async (req = request, res = response) => {
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
router.get('/funcionarios/search-one/:text', verificarToken, async (req = request, res = response) => {
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
router.put('/funcionarios/:id', verificarToken, async (req = request, res = response) => {
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
router.delete('/funcionarios/:id', verificarToken, async (req = request, res = response) => {
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
router.get('/cuentas/dependencias/:id_institucion', verificarToken, async (req = request, res = response) => {
    try {
        const dependencias = await cuentaService.getDependencias(req.params.id_institucion)
        return res.status(200).json({
            dependencias
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/cuentas/funcionarios/:text', verificarToken, async (req = request, res = response) => {
    try {
        const funcionarios = await cuentaService.getUserAssign(req.params.text)
        return res.status(200).json({
            funcionarios
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/cuentas', verificarToken, async (req = request, res = response) => {
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
router.put('/cuentas/:id', verificarToken, async (req = request, res = response) => {
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
router.get('/cuentas/details/:id', verificarToken, async (req = request, res = response) => {
    try {
        const { externos, internos, entrada, salida } = await cuentaService.getDetails(req.params.id)
        return res.status(200).json({
            externos,
            internos,
            entrada,
            salida
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.post('/cuentas', verificarToken, async (req = request, res = response) => {
    try {
        const cuenta = await cuentaService.add(req.body.cuenta, req.body.funcionario)
        return res.status(200).json({
            cuenta
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/cuentas/search', verificarToken, async (req = request, res = response) => {
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
router.put('/funcionarios/:id', verificarToken, async (req = request, res = response) => {
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
router.delete('/funcionarios/:id', verificarToken, async (req = request, res = response) => {
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





module.exports = router