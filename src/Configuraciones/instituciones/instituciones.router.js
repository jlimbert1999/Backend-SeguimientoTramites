const router = require('express').Router()
const controller = require('./instituciones.controller')

router.post('/', controller.agregar_institucion)
router.get('/', controller.obtener_instituciones)
router.get('/:termino', controller.buscar_instituciones)
router.put('/:id', controller.editar_institucion)

module.exports = router