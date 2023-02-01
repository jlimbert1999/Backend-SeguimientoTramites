const router = require("express").Router();
const controller = require("./cuenta.controller");
const validarBody = require("../../../middlewares/validar_body");
const { check } = require("express-validator");
const controllerDependencias = require('../dependencias/dependencias.controller')

router.post("/", [
    check('cuenta').isObject(),
    check('funcionario').isObject(),
    validarBody
], controller.add);
router.get("/", controller.get)
router.put("/:id", controller.editar_cuenta)



router.get("/instituciones", controllerDependencias.getInstituciones)

router.get("/dependencias/:id_institucion", controller.getDependencias)

router.get("/usuarios", controller.obtener_funcionarios_asignacion)

router.get('/assign/:text', controller.getUsersforAssign)
router.put("/assign/:id", controller.assingAccount)
router.put('/unlink/:id', controller.unlinkUser)

router.delete('/:id', controller.disabled)
router.get("/search/:text", controller.search)

// create account width select user
router.post("/assign", controller.addAccountLink)

module.exports = router;
