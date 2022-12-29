const getMenuFrontend = (rol) => {
  let Menu = []
  if (rol == 'admin') {
    Menu = [
      {
        modulo: "Configuraciones",
        submodulos: [
          { nombre: 'Instituciones', ruta: 'instituciones', icon: 'apartment' },
          { nombre: 'Dependencias', ruta: 'dependencias', icon: 'holiday_village' },
          { nombre: 'Tipos de tramite', ruta: 'tipos', icon: 'note' },
        ]

      },
      {
        modulo: "Usuarios",
        submodulos: [
          { nombre: 'Cuentas', ruta: 'cuentas', icon: 'account_circle' },
          { nombre: 'Funcionarios', ruta: 'funcionarios', icon: 'person' },
          { nombre: 'Grupo de trabajo', ruta: 'groupware', icon: 'groups' }
        ]
      }
    ]
  }
  else if (rol == 'EVALUACION') {
    Menu = [
      {
        modulo: "Tramites",
        submodulos: [
          { nombre: 'Internos', ruta: 'tramites-internos', icon: 'description' },
        ]
      },
      {
        modulo: "Bandejas",
        submodulos: [
          { nombre: 'Bandeja entrada', ruta: 'bandeja-entrada', icon: 'mail' },
          { nombre: 'Bandeja salida', ruta: 'bandeja-salida', icon: 'drafts' },
        ]
      },
      {
        modulo: "Reportes",
        submodulos: [
          { nombre: 'Reporte ficha', ruta: 'reporte-ficha', icon: 'content_paste' },
          { nombre: 'Reporte estado', ruta: 'reporte-estado', icon: 'content_paste' },
          { nombre: 'Reporte tipo', ruta: 'reporte-tipo', icon: 'content_paste' },
          { nombre: 'Reporte solicitante', ruta: 'reporte-contribuyente', icon: 'content_paste' },
          { nombre: 'Busqueda solicitante', ruta: 'reporte-solicitante', icon: 'manage_search' },
        ]
      }
    ]
  }
  else {
    Menu = [
      {
        modulo: "Tramites",
        submodulos: [
          { nombre: 'Externos', ruta: 'tramites-externos', icon: 'description' },
          { nombre: 'Internos', ruta: 'tramites-internos', icon: 'description' },
        ]
      },
      {
        modulo: "Bandejas",
        submodulos: [
          { nombre: 'Bandeja entrada', ruta: 'bandeja-entrada', icon: 'mail' },
          { nombre: 'Bandeja salida', ruta: 'bandeja-salida', icon: 'drafts' },
        ]
      },
      {
        modulo: "Reportes",
        submodulos: [
          { nombre: 'Reporte ficha', ruta: 'reporte-ficha', icon: 'content_paste' },
          { nombre: 'Reporte estado', ruta: 'reporte-estado', icon: 'content_paste' },
          { nombre: 'Reporte tipo', ruta: 'reporte-tipo', icon: 'content_paste' },
          { nombre: 'Reporte solicitante', ruta: 'reporte-contribuyente', icon: 'content_paste' },
          { nombre: 'Busqueda solicitante', ruta: 'reporte-solicitante', icon: 'manage_search' },
        ]
      }
    ]
  }


  return Menu


}
module.exports = {
  getMenuFrontend
}