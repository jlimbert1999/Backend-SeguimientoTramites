const router = require('express').Router()



const ConsultaRouter = require('./src/Consulta/consulta.router')



const PerfilRouter = require('./src/Configuraciones/perfil/perfil.router')

const ArchivoController = require('./src/Archivos/archivo.controller')
const ReporteController = require('./src/Reportes/reporte.controller')
const AuthController = require('./src/Auth/auth.controller')

const CuentaController = require('./src/Configuraciones/controllers/cuenta.controller')
const InstitucionController = require('./src/Configuraciones/controllers/instituciones.controller')
const DependenciaController = require('./src/Configuraciones/controllers/dependencia.controller')
const FuncionarioController = require('./src/Configuraciones/controllers/funcionario.controller')
const TipoController = require('./src/Configuraciones/controllers/tipos.controller')
const RolController = require('./src/Configuraciones/controllers/roles.controller')

const ExternoController = require('./src/Tramites/controllers/externo.controller')
const InternoController = require('./src/Tramites/controllers/interno.controller')

const EntradaController = require('./src/Bandejas/controllers/entrada.controller')
const SalidaController = require('./src/Bandejas/controllers/salida.controller')

const verifyRole = require('./middlewares/verifyRole')
const verifyToken = require('./middlewares/verifyToken')


router.use('/consulta', ConsultaRouter)

router.use('/perfil', PerfilRouter)

// nuevo
router.use('/login', AuthController)
router.use('/cuentas', [verifyToken, verifyRole('cuentas')], CuentaController)
router.use('/instituciones', [verifyToken, verifyRole('instituciones')], InstitucionController)
router.use('/dependencias', [verifyToken, verifyRole('dependencias')], DependenciaController)
router.use('/funcionarios', [verifyToken, verifyRole('usuarios')], FuncionarioController)
router.use('/configuraciones', [verifyToken, verifyRole('tipos')], TipoController)
router.use('/configuraciones', [verifyToken, verifyRole('roles')], RolController)
router.use('/externos', [verifyToken,  verifyRole('externos')], ExternoController)
router.use('/internos', [verifyToken, verifyRole('internos')], InternoController)

router.use('/entradas', [verifyToken, verifyRole('entradas')], EntradaController)
router.use('/salidas', [verifyToken, verifyRole('salidas')], SalidaController)
router.use('/archivos', [verifyToken, verifyRole('archivos')], ArchivoController)
router.use('/reportes', ReporteController)

module.exports = router