const getMenuFrontend = (resources) => {
  let Menu = [
    {
      text: "Usuarios",
      icon: "groups",
      children: [
      ]
    },
    {
      text: "Unidades",
      icon: "domain",
      children: [
      ]
    }
  ]
  resources.forEach(resource => {
    switch (resource) {
      case 'cuentas':
        Menu[0].children.push(
          {
            text: "Cuentas",
            icon: "account_circle",
            routerLink: "configuraciones/cuentas",
          }
        )
        break;
      case 'usuarios':
        Menu[0].children.push(
          {
            text: "Funcionarios",
            icon: "person",
            routerLink: "configuraciones/funcionarios",
          },
        )
        break;
      case 'roles':
        Menu[0].children.push(
          {
            text: "Roles",
            icon: "badge",
            routerLink: "configuraciones/roles",
          },
        )
        break
      case 'instituciones':
        Menu[1].children.push(
          {
            text: "Instituciones",
            icon: "apartment",
            routerLink: "configuraciones/instituciones",
          },
        )
        break
      case 'dependencias':
        Menu[1].children.push(
          {
            text: "Dependencias",
            icon: "holiday_village",
            routerLink: "configuraciones/dependencias",
          }
        )
        break
      case 'tipos':
        Menu.push(
          {
            text: "Tipos",
            icon: "folder_copy",
            routerLink: "configuraciones/tipos",
          },
        )
        break;
      default:
        break;
    }
  });
  //   if (rol.includes('ADMINISTRADOR')) {
  //     Menu = [
  //       {
  //         text: "Configuraciones",
  //         icon: "settings",
  //         children: [
  //           {
  //             text: "Instituciones",
  //             icon: "apartment",
  //             routerLink: "configuraciones/instituciones",
  //           },
  //           {
  //             text: "Dependencias",
  //             icon: "holiday_village",
  //             routerLink: "configuraciones/dependencias",
  //           },
  //           {
  //             text: "Tipos de tramite",
  //             icon: "note",
  //             routerLink: "configuraciones/tipos",
  //           },
  //         ]
  //       },
  //       {
  //         text: "Usuarios",
  //         icon: "workspaces",
  //         children: [
  //           {
  //             text: "Cuentas",
  //             icon: "account_circle",
  //             routerLink: "configuraciones/cuentas",
  //           },
  //           {
  //             text: "Funcionarios",
  //             icon: "person",
  //             routerLink: "configuraciones/funcionarios",
  //           },
  //           {
  //             text: "Grupo de trabajo",
  //             icon: "groups",
  //             routerLink: "configuraciones/groupware",
  //           },
  //           {
  //             text: "Organigrama",
  //             icon: "groups",
  //             routerLink: "configuraciones/organigrama",
  //           },
  //           {
  //             text: "Roles",
  //             icon: "groups",
  //             routerLink: "configuraciones/roles",
  //           },
  //         ]
  //       },
  //     ]
  //   }
  //   else if (rol == 'EVALUACION') {
  //     Menu = [
  //       {
  //         text: "Internos",
  //         icon: "description",
  //         routerLink: "tramites/internos"
  //       },
  //       {
  //         text: "Bandeja entrada",
  //         icon: "drafts",
  //         routerLink: "bandejas/entrada",
  //       },
  //       {

  //         text: "Bandeja salida",
  //         icon: "mail",
  //         routerLink: "bandejas/salida",
  //       },
  //       {
  //         text: "Archivos",
  //         icon: "folder_copy",
  //         routerLink: "archivos",
  //       },
  //       {
  //         text: "Reportes",
  //         icon: "analytics",
  //         children: [
  //           {
  //             text: "Ficha de tramite",
  //             icon: "description",
  //             routerLink: "ficha",
  //           },
  //           {
  //             text: "Estado",
  //             icon: "document_scanner",
  //             routerLink: "reporte-estado",
  //           },
  //           {
  //             text: "Tipo",
  //             icon: "folder_open",
  //             routerLink: "reporte-tipo",
  //           },
  //           {
  //             text: "Solicitante",
  //             icon: "contact_page",
  //             routerLink: "reportes/solicitante",
  //           },
  //           {
  //             text: "Busqueda",
  //             icon: "person_search",
  //             routerLink: "reporte-solicitante",
  //           },
  //           {
  //             text: "Busqueda",
  //             icon: "find_in_page",
  //             routerLink: "reportes/busqueda",
  //           },
  //           {
  //             text: "Estadistico",
  //             icon: "find_in_page",
  //             routerLink: "reportes/estadistico",
  //           },
  //           {
  //             text: "Unidad",
  //             icon: "find_in_page",
  //             routerLink: "reportes/unidad",
  //           },
  //         ]
  //       }
  //     ]
  //   }
  //   else {
  //     Menu = [
  //       {
  //         text: "Externos",
  //         icon: "folder",
  //         routerLink: "tramites/externos",
  //       },
  //       {
  //         text: "Internos",
  //         icon: "snippet_folder",
  //         routerLink: "tramites/internos"
  //       },
  //       {

  //         text: "Bandeja entrada",
  //         icon: "drafts",
  //         routerLink: "bandejas/entrada",
  //       },
  //       {

  //         text: "Bandeja salida",
  //         icon: "mail",
  //         routerLink: "bandejas/salida",
  //       },
  //       {
  //         text: "Archivos",
  //         icon: "folder_copy",
  //         routerLink: "archivos",
  //       },
  //       {
  //         text: "Reportes",
  //         icon: "analytics",
  //         children: [
  //           {
  //             text: "Ficha de tramite",
  //             icon: "description",
  //             routerLink: "reportes/ficha",
  //           },
  //           {
  //             text: "Estado",
  //             icon: "document_scanner",
  //             routerLink: "reporte-estado",
  //           },
  //           {
  //             text: "Tipo",
  //             icon: "folder_open",
  //             routerLink: "reporte-tipo",
  //           },
  //           {
  //             text: "Solicitante",
  //             icon: "contact_page",
  //             routerLink: "reportes/solicitante",
  //           },
  //           {
  //             text: "Busqueda",
  //             icon: "person_search",
  //             routerLink: "reporte-solicitante",
  //           },
  //           {
  //             text: "Busqueda",
  //             icon: "find_in_page",
  //             routerLink: "reportes/busqueda",
  //           },
  //           {
  //             text: "Estadistico",
  //             icon: "find_in_page",
  //             routerLink: "reportes/estadistico",
  //           },
  //           {
  //             text: "Unidad",
  //             icon: "find_in_page",
  //             routerLink: "reportes/unidad",
  //           },
  //         ]
  //       },

  //     ]
  //   }


  return Menu
}
module.exports = getMenuFrontend
