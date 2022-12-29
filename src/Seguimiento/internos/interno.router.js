const router = require('express').Router()
const controller = require('./interno.controller')


router.get('/tipos', controller.GetTiposTramites)

router.post('/', controller.addInterno)
router.get('/', controller.GetInternos)
router.put('/:id', controller.PutInterno)
router.get('/:id', controller.GetInterno)

// AGREGAR OBSERVACIONES
router.put('/observacion/:id', controller.addObservacion)
router.put('/observacion/corregir/:id', controller.putObservacion)

router.get('/usuarios/:termino', controller.getUsers)



module.exports = router