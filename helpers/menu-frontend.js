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
          { nombre: 'Registrados', ruta: 'control', icon: 'description' },
        ]
      }
    ]
  }


  return Menu


}
module.exports = {
  getMenuFrontend
}