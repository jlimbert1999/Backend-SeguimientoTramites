const router = require('express').Router()
const controller = require('./dependencias.controller')

router.post('/', controller.agregar_dependencia)

router.get('/', controller.obtener_dependencias)

router.put('/:id', controller.editar_dependencia)

router.put('/situacion/:id', controller.cambiar_situacion_dependencia)

router.get('/:termino', controller.buscar_dependencia)

// obtener instituciones disponibles para registrar dependencia
router.get('/instituciones/registro', controller.obtener_instituciones)

module.exports = router