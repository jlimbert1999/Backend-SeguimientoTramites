const router = require('express').Router()
const controller = require('./perfil.controller')
router.get('/', controller.getAccount)
router.put('/', controller.editAccount)
router.get('/work/:id', controller.getWorkDetails)

module.exports = router