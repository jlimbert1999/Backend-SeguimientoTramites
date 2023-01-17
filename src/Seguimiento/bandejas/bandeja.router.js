const router = require('express').Router()
const controller = require('./bandeja.controller')
const controllerDependencias = require('../../Configuraciones/dependencias/dependencias.controller')
const controllerCuentas = require('../../Configuraciones/cuentas/cuenta.controller')


router.get('/entrada', controller.getMailsIn)
router.get('/salida', controller.obtener_bandeja_salida)
router.post('/', controller.agregar_mail)
router.put('/aceptar/:id', controller.aceptar_tramite)
router.put('/rechazar/:id', controller.rechazar_tramite)

router.get('/detalle/:id', controller.getDetailsMail)

router.get('/users/:id_dependencia', controller.getUsers)
router.get('/instituciones', controllerDependencias.obtener_instituciones)
router.get('/dependencias/:id_institucion', controllerCuentas.obtener_dependencias)




module.exports = router