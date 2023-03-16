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
        console.log(req.query)
        let params = req.query
        let type = req.params.tipo
        if (!type) {
            return res.status(400).json({
                ok: false,
                message: 'Seleccione el tipo de tramite (INTERNO / EXTERNO) para generar el reporte'
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

module.exports = router