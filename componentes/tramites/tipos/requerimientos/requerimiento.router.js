const router = require("express").Router();
const controller = require("./requerimiento.controller");

router.post("/", controller.agregar_requerimiento)

router.get("/", controller.obtener_requerimientos)


module.exports = router;
