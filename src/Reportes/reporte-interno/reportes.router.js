const router = require('express').Router()
const controller = require('./reportes.controller')

router.get('/ficha/:alterno', controller.GetReporteFicha)
router.get('/ruta/:alterno', controller.GetReporteRuta)
router.get('/estado/:estado', controller.GertReporteEstado)
// router.get('/solicitante/:termino', controller.GetReporteSolicitante)
// router.get('/contribuyente/:dni', controller.GetReporteContribuyente)
router.get('/tipo-tramite/:institucion', controller.GetReporteTipoTramite)
module.exports = router