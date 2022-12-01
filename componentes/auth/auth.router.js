const router = require("express").Router();
const controller = require("./auth.controller");
const { verificarToken } = require('../../middlewares/jwt')
router.post("/", controller.login);

router.get("/verify", [verificarToken], controller.renovar_token);

module.exports = router;
