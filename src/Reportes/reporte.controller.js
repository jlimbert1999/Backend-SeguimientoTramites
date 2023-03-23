const router = require('express').Router()
const { request, response, json } = require('express');
const { verificarToken } = require('../../middlewares/jwt');
const { ServerErrorResponde } = require('../../helpers/responses')

const ReporteService = require('./services/reporte.service')
const reporteService = new ReporteService()

router.get('/ficha/:alterno', async (req = request, res = response) => {
    try {
        const { tramite, workflow, tipo } = await reporteService.reporteFicha(req.params.alterno)
        return res.status(200).json({
            tramite,
            workflow,
            tipo
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
        const { tramites, length } = await reporteService.reporteBusqueda(params, type)
        return res.status(200).json({
            tramites,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.post('/solicitante', async (req = request, res = response) => {
    try {
        if (!req.body) {
            return res.status(400).json({
                ok: false,
                message: 'Debe seleccionar los parametros para la busqueda'
            })
        }
        const tramites = await reporteService.reporteSolicitante(req.body)
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
        co
        if (!req.body) {
            return res.status(400).json({
                ok: false,
                message: 'Debe seleccionar los parametros para la busqueda'
            })
        }
        const tramites = await reporteService.reporteRepresentante(req.body)
        return res.status(200).json({
            ok: true,
            tramites
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/estadistico/instituciones', async (req = request, res = response) => {
    try {
        const data = await reporteService.estadisticoInstitucion()
        return res.json({
            ok: true,
            data
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

module.exports = router