const router = require('express').Router()
const { verificarToken, verificarAdminRol, verificarRecepcionRol } = require('./middlewares/jwt')

const usuariosRouter = require('./src/Configuraciones/usuarios/usuarios.router')
const institucionRouter = require('./src/Configuraciones/instituciones/instituciones.router')
const dependenciasRouter = require('./src/Configuraciones/dependencias/dependencias.router')
const cuentasRouter = require('./src/Configuraciones/cuentas/cuenta.router')
const routerAuth = require('./src/Auth/auth.router')

const tiposTramitesRouter = require('./src/Configuraciones/tipos-tramites/tipoTramite.router')
const RequerimientosRouter = require('./src/Configuraciones/tipos-tramites/tipoTramite.router')

const ExternoRouter = require('./src/Seguimiento/externos/externo.router')
// const BandejaRouter = require('./src/Seguimiento/bandejas/bandeja.router')

const ReportesExternosRouter = require('./src/Reportes/reporte-externo/reportes.router')
const ReportesInternosRouter = require('./src/Reportes/reporte-interno/reportes.router')

const ConsultaRouter = require('./src/Consulta/consulta.router')

const InternoRouter = require('./src/Seguimiento/internos/interno.router')

const PerfilRouter = require('./src/Configuraciones/perfil/perfil.router')

const ExternoController = require('./src/Tramites/tramite.controller')
const BandejaController = require('./src/Bandejas/bandejas.controller')
const ArchivoController = require('./src/Archivos/archivo.controller')

router.use('/login', routerAuth)
// ADMINISTRADOR
router.use('/usuarios', [verificarToken, verificarAdminRol], usuariosRouter)
router.use('/cuentas', [verificarToken, verificarAdminRol], cuentasRouter)
router.use('/instituciones', [verificarToken, verificarAdminRol], institucionRouter)
router.use('/dependencias', [verificarToken, verificarAdminRol], dependenciasRouter)
router.use('/tipos-tramites', [verificarToken, verificarAdminRol], tiposTramitesRouter)
router.use('/requerimientos', [verificarToken, verificarAdminRol], RequerimientosRouter)


// FUNCIONARIOS
// router.use('/externos', [verificarToken], ExternoRouter)
// router.use('/bandejas', [verificarToken], BandejaRouter)


router.use('/internos', [verificarToken], InternoRouter)

router.use('/reportes-externos', [verificarToken], ReportesExternosRouter)
router.use('/reportes-internos', ReportesInternosRouter)

router.use('/consulta', ConsultaRouter)

router.use('/perfil', verificarToken, PerfilRouter)

// nuevo
router.use('/tramites', ExternoController)
router.use('/bandejas', BandejaController)
router.use('/archivos', ArchivoController)

module.exports = router