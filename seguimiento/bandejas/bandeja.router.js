const router = require('express').Router()
const controller = require('./bandeja.controller')
const controllerDependencias = require('../../componentes/dependencias/dependencias.controller')
const controllerCuentas = require('../../componentes/cuentas/cuenta.controller')


router.get('/entrada', controller.obtener_bandeja_entrada)
router.get('/salida', controller.obtener_bandeja_salida)
router.post('/', controller.agregar_mail)
router.put('/aceptar/:id_tramite', controller.aceptar_tramite)
router.put('/rechazar/:id_tramite', controller.rechazar_tramite)

router.get('/funcionarios-envio/:id_dependencia', controller.obtener_usuarios_envio)
router.get('/instituciones-envio', controllerDependencias.obtener_instituciones)
router.get('/dependencias-envio/:id_institucion', controllerCuentas.obtener_dependencias)




module.exports = router