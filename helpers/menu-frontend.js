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
    ]
  }
  else if (rol == 'EVALUACION') {
    Menu = [
      {
        text: "Internos",
        icon: "description",
        routerLink: "tramites-internos"
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
        text: "Archivos",
        icon: "folder_copy",
        routerLink: "archivos",
      },
      {
        text: "Reportes",
        icon: "analytics",
        children: [
          {
            text: "Ficha de tramite",
            icon: "description",
            routerLink: "ficha",
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
        routerLink: "tramites-externos",
      },
      {
        text: "Internos",
        icon: "snippet_folder",
        routerLink: "tramites-internos"
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
        text: "Archivos",
        icon: "folder_copy",
        routerLink: "archivos",
      },
      {
        text: "Reportes",
        icon: "analytics",
        children: [
          {
            text: "Ficha de tramite",
            icon: "description",
            routerLink: "reportes/ficha",
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