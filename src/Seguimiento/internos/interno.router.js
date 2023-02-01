const router = require('express').Router()
const controller = require('./interno.controller')


router.get('/tipos', controller.getTypes)

router.post('/', controller.add)
router.get('/', controller.get)
router.put('/:id', controller.edit)
router.get('/:id', controller.getOne)

router.put('/concluir/:id', controller.concludedTramite)

// AGREGAR OBSERVACIONES
router.put('/observacion/:id', controller.addObservacion)
router.put('/observacion/corregir/:id', controller.putObservacion)

router.get('/usuarios/:termino', controller.getUsers)

router.get('/search/:text', controller.search)

module.exports = router