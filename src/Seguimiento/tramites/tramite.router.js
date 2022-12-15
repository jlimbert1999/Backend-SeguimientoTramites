const router = require('express').Router()
const controller = require('./tramite.controller')

// TIPOS DE TRAMITE EXTERNOS
router.get('/tipos', controller.getTiposTramite)

// AGREGAR OBSERVACIONES
router.put('/observacion/:id', controller.addObservacion)
router.put('/observacion/corregir/:id', controller.putObservacion)

// ADMINISTRACION DE TRAMITE
router.get('/', controller.getExternos)
router.post('/', controller.addExterno)
router.put('/:id', controller.editExterno)


// VER TODA LA INFORMACION DE UN TRAMITE
router.get('/:id', controller.getExterno)

// generacion de pdf
router.get('/ruta/:id', controller.generateRuta)

module.exports = router