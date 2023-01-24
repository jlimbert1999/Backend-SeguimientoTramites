const getMenuFrontend = (rol) => {
  let Menu = []
  if (rol == 'admin') {
    Menu = [
      {
        text: "Configuraciones",
        icon: "settings",
        children: [
          {
            text: "Instituciones",
            icon: "apartment",
            routerLink: "instituciones",
          },
          {
            text: "Dependencias",
            icon: "holiday_village",
            routerLink: "dependencias",
          },
          {
            text: "Tipos de tramite",
            icon: "note",
            routerLink: "tipos",
          },
        ]
      },
      {
        text: "Usuarios",
        icon: "workspaces",
        children: [
          {
            text: "Cuentas",
            icon: "account_circle",
            routerLink: "cuentas",
          },
          {
            text: "Funcionarios",
            icon: "person",
            routerLink: "funcionarios",
          },
          {
            text: "Grupo de trabajo",
            icon: "groups",
            routerLink: "groupware",
          },
        ]
      },
      // {
      //   modulo: "Configuraciones",
      //   submodulos: [
      //     { nombre: 'Instituciones', ruta: 'instituciones', icon: 'apartment' },
      //     { nombre: 'Dependencias', ruta: 'dependencias', icon: 'holiday_village' },
      //     { nombre: 'Tipos de tramite', ruta: 'tipos', icon: 'note' },
      //   ]

      // },
      // {
      //   modulo: "Usuarios",
      //   submodulos: [
      //     { nombre: 'Cuentas', ruta: 'cuentas', icon: 'account_circle' },
      //     { nombre: 'Funcionarios', ruta: 'funcionarios', icon: 'person' },
      //     { nombre: 'Grupo de trabajo', ruta: 'groupware', icon: 'groups' }
      //   ]
      // }
    ]
  }
  else if (rol == 'EVALUACION') {
    Menu = [
      {
        text: "Internos",
        icon: "description",
        children: [
          {
            text: "Registros",
            icon: "description",
            routerLink: "tramites-internos",
          },
        ]
      },
      {
        text: "Bandeja entrada",
        icon: "drafts",
        routerLink: "bandeja-entrada",
      },
      {

        text: "Bandeja salida",
        icon: "mail",
        routerLink: "bandeja-salida",
      },
      {
        text: "Reportes",
        icon: "analytics",
        children: [
          {
            text: "Ficha de tramite",
            icon: "description",
            routerLink: "reporte-ficha",
          },
          {
            text: "Estado",
            icon: "document_scanner",
            routerLink: "reporte-estado",
          },
          {
            text: "Tipo",
            icon: "folder_open",
            routerLink: "reporte-tipo",
          },
          {
            text: "Solicitante",
            icon: "contact_page",
            routerLink: "reporte-contribuyente",
          },
          {
            text: "Busqueda",
            icon: "person_search",
            routerLink: "reporte-solicitante",
          },
        ]
      }
    ]
  }
  else {
    Menu = [
      {
        text: "Externos",
        icon: "folder",
        children: [
          {
            text: "Administracion",
            icon: "widgets",
            routerLink: "tramites-externos",
          }
        ]
      },
      {
        text: "Internos",
        icon: "snippet_folder",
        children: [
          {
            text: "Administracion",
            icon: "widgets",
            routerLink: "tramites-internos",
          }
        ]
      },
      {

        text: "Bandeja entrada",
        icon: "drafts",
        routerLink: "bandeja-entrada",
      },
      {

        text: "Bandeja salida",
        icon: "mail",
        routerLink: "bandeja-salida",
      },
      {
        text: "Reportes",
        icon: "analytics",
        children: [
          {
            text: "Ficha de tramite",
            icon: "description",
            routerLink: "reporte-ficha",
          },
          {
            text: "Estado",
            icon: "document_scanner",
            routerLink: "reporte-estado",
          },
          {
            text: "Tipo",
            icon: "folder_open",
            routerLink: "reporte-tipo",
          },
          {
            text: "Solicitante",
            icon: "contact_page",
            routerLink: "reporte-contribuyente",
          },
          {
            text: "Busqueda",
            icon: "person_search",
            routerLink: "reporte-solicitante",
          },
        ]
      },

    ]
  }


  return Menu


}
module.exports = {
  getMenuFrontend
}