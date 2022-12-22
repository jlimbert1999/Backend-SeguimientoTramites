const router = require('express').Router()
const controller = require('./consulta.controller')
router.get('/', controller.consultar)

module.exports = router