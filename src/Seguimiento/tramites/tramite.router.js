const router = require('express').Router()
const controller = require('./tramite.controller')
const checkFields = require('../../../middlewares/validar_body')
const { check, param } = require('express-validator')

// TIPOS DE TRAMITE EXTERNOS
router.get('/tipos/:segmento', controller.getTypes)
router.get('/segmentos', controller.getGroupsTypes)

// AGREGAR OBSERVACIONES
router.put('/observacion/:id', controller.addObservacion)
router.put('/observacion/corregir/:id', controller.putObservacion)

// ADMINISTRACION DE TRAMITE
router.get('/', controller.getExternos)
router.post('/', controller.addExterno)
router.put('/:id', controller.editExterno)


// VER TODA LA INFORMACION DE UN TRAMITE
router.get('/:id',
    [
        param('id', 'Id tramite no es correcto').isMongoId(),
        checkFields
    ]
    , controller.getExterno)

// CONCLUIR TRAMITE
router.delete('/:id', controller.concludedTramite)

// generacion de pdf
router.get('/ruta/:id', controller.generateRuta)

router.get('/filtrar/:termino', controller.filter)

module.exports = router