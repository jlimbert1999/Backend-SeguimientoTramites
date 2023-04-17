const router = require('express').Router()
const { request, response } = require('express');
const { ServerErrorResponde } = require('../../helpers/responses')

const reporteService = require('./services/reporte.service')

const DependenciaService = require('../Configuraciones/services/dependencias.service')
const dependenciaService = new DependenciaService()

const CuentasService = require('../Configuraciones/services/cuentas.service')
const cuentasService = new CuentasService()

router.get('/ficha/:alterno', async (req = request, res = response) => {
    try {
        const { group } = req.query
        if (!group) {
            return res.status(200).json({
                ok: false,
                message: 'No se ha seleccionado el grupo del tramite: Externo o Interno'
            })
        }
        const tramites = await reporteService.getReportFicha(req.params.alterno, group)
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
        const tramites = await reporteService.getReportByUnit(req.query, req.params.group)
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
        const instituciones = await dependenciaService.getInstituciones()
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
        const dependencias = await cuentasService.getDependencias(req.params.id_institucion)
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
        const users = await reporteService.getUsersForReport(req.params.id_dependencia)
        return res.status(200).json({
            ok: true,
            users
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/types/:type', async (req = request, res = response) => {
    try {
        const types = await reporteService.getTypesProceduresForReport(req.params.type)
        return res.status(200).json({
            ok: true,
            types
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})






module.exports = router