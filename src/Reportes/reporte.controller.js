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
        const tramites = await reporteService.reporteBusqueda(params)
        return res.status(200).json({
            tramites
        })

    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

module.exports = router