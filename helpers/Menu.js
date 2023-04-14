const getmenuFrontend = (resources) => {
  let menu = [
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
        menu[0].children.push(
          {
            text: "Cuentas",
            icon: "account_circle",
            routerLink: "configuraciones/cuentas",
          }
        )
        break;
      case 'usuarios':
        menu[0].children.push(
          {
            text: "Funcionarios",
            icon: "person",
            routerLink: "configuraciones/funcionarios",
          },
        )
        break;
      case 'roles':
        menu[0].children.push(
          {
            text: "Roles",
            icon: "badge",
            routerLink: "configuraciones/roles",
          },
        )
        break
      case 'instituciones':
        menu[1].children.push(
          {
            text: "Instituciones",
            icon: "apartment",
            routerLink: "configuraciones/instituciones",
          },
        )
        break
      case 'dependencias':
        menu[1].children.push(
          {
            text: "Dependencias",
            icon: "holiday_village",
            routerLink: "configuraciones/dependencias",
          }
        )
        break
      case 'tipos':
        menu.push(
          {
            text: "Tipos",
            icon: "folder_copy",
            routerLink: "configuraciones/tipos",
          },
        )
        break;
      case 'externos':
        menu.push(
          {
            text: "Externos",
            icon: "folder",
            routerLink: "tramites/externos",
          }
        )
        break;
      case 'internos':
        menu.push(
          {
            text: "Internos",
            icon: "description",
            routerLink: "tramites/internos"
          }
        )
        break;
      case 'entradas':
        menu.push(
          {
            text: "Bandeja entrada",
            icon: "drafts",
            routerLink: "bandejas/entrada",
          },
        )
        break;
      case 'salidas':
        menu.push(
          {
            text: "Bandeja salida",
            icon: "mail",
            routerLink: "bandejas/salida",
          },
        )
        break;
      default:
        break;
    }
  });
  resources.some(resorce => resorce.includes('reporte'))
    ? menu.push({
      text: "Reportes",
      icon: "mail",
      routerLink: "reportes",
    })
    : ''
  return menu
}
module.exports = getmenuFrontend
