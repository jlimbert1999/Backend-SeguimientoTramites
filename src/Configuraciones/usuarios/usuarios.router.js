const router = require('express').Router()
const controller = require('./usuarios.controller')

router.get('/', controller.obtener_usuarios)
router.post('/', controller.agregar_usuario)
router.post('/cargar', controller.agregar_multiples_usuarios)
router.put('/:id', controller.editar_usuario)
router.get('/:termino', controller.buscar_Usuarios)

router.put('/situacion/:id', controller.cambiar_situacion_usuario)
router.get('/movilidad/:id_funcionario', controller.obtener_detalles_movilidad)

module.exports = router