const router = require('express').Router()
const controller = require('./externo.controller')
const checkFields = require('../../../middlewares/validar_body')
const { check, param } = require('express-validator')

// Obtener datos para registro
router.get('/tipos/:segmento', controller.getTypes)
router.get('/segmentos', controller.getGroupsTypes)

// Manejo de observaciones
router.put('/observacion/:id', controller.addObservacion)
router.put('/observacion/corregir/:id', controller.putObservacion)


// Administrar tramite
router.get('/', controller.get)
router.post('/', controller.add)
router.put('/:id', controller.edit)
router.delete('/:id', controller.concludedTramite)

// Buscar tramites
router.get('/search/:text', controller.search)

// Obtener toda la informacion de un tramite
router.get('/:id',
    [
        param('id', 'Id tramite no es correcto').isMongoId(),
        checkFields
    ]
    , controller.getOne)

module.exports = router