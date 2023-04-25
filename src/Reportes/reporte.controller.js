const router = require('express').Router()
const { request, response } = require('express');
const { ServerErrorResponde } = require('../../helpers/responses')

const reporteService = require('./services/reporte.service')

const dependenciaService = require('../Configuraciones/services/dependencias.service')
const institutionService = require('../Configuraciones/services/instituciones.service')
const accountService = require('../Configuraciones/services/cuentas.service')
const typeProcedureService = require('../Configuraciones/services/tipos.service')

router.get('/ficha/:group', async (req = request, res = response) => {
    try {
        const isEmpty = Object.values(req.query).every(x => x === null || x === '');
        if (isEmpty) return res.status(400).json({ ok: false, message: 'No se selecciono ningun parametro para generar el reporte' })
        const tramites = await reporteService.getReportFicha(req.params.group, req.query)
        return res.status(200).json({
            ok: true,
            tramites
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})


router.get('/busqueda/:tipo', async (req = request, res = response) => {
    try {
        let params = req.query
        let type = req.params.tipo
        if (type === undefined || params === undefined) {
            return res.status(400).json({
                ok: false,
                message: 'Parametros para la busqueda incorrectos.'
            })
        }
        const { tramites, length } = await reporteService.getReportSearch(params, type)
        return res.status(200).json({
            tramites,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/solicitante', async (req = request, res = response) => {
    try {
        let { start, end, ...params } = req.query
        const tramites = await reporteService.reportSolicitante(params, start, end)
        return res.status(200).json({
            ok: true,
            tramites
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.post('/representante', async (req = request, res = response) => {
    try {
        const tramites = await reporteService.reportRepresentante(req.body)
        return res.status(200).json({
            ok: true,
            tramites
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})


router.get('/unit/:group', async (req = request, res = response) => {
    try {
        const isEmpty = Object.values(req.query).every(x => x === null || x === '');
        if (isEmpty) return res.status(400).json({ ok: false, message: 'No se selecciono ningun parametro para generar el reporte' })
        const tramites = await reporteService.getReportByUnit(req.params.group, req.query)
        return res.status(200).json({
            ok: true,
            tramites
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})


// GET DATA FOR PARAMS SEARCH 
router.get('/instituciones', async (req = request, res = response) => {
    try {
        const instituciones = await institutionService.getActiveIntituciones()
        return res.status(200).json({
            ok: true,
            instituciones
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/dependencias/:id_institucion', async (req = request, res = response) => {
    try {
        const dependencias = await dependenciaService.getDependenciesOfInstitucion(req.params.id_institucion)
        return res.status(200).json({
            ok: true,
            dependencias
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/users/:id_dependencia', async (req = request, res = response) => {
    try {
        const users = await accountService.getAccountByDependencie(req.params.id_dependencia)
        return res.status(200).json({
            ok: true,
            users
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/accounts/:text', async (req = request, res = response) => {
    try {
        const accounts = await accountService.getAccountsByText(req.params.text)
        return res.status(200).json({
            ok: true,
            accounts
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/types/:group', async (req = request, res = response) => {
    try {
        const types = await typeProcedureService.getNameOfTypesProcedures(req.params.group)
        return res.status(200).json({
            ok: true,
            types
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/account/procedures/:group', async (req = request, res = response) => {
    try {
        const isEmpty = Object.values(req.query).every(x => x === null || x === '');
        if (isEmpty) return res.status(400).json({ ok: false, message: 'No se selecciono ningun patametro para generar el reporte' })
        const procedures = await reporteService.getReportByAccount(req.params.group, req.query)
        console.log(procedures)
        return res.status(200).json({
            ok: true,
            procedures
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})







module.exports = router