const router = require('express').Router()
const controller = require('./tramite.controller')

router.get('/externo/segmentos', controller.obtener_segmentos)
router.get('/tipos', controller.obtener_tipos_tramites)
router.post('/externo', controller.agregar_tramite_externo)
router.put('/externo/:id_tramite', controller.editar_tramite_externo)
router.get('/', controller.obtener_mis_tramites_externos)
router.get('/:id', controller.obtener_info_tramite)

module.exports = router