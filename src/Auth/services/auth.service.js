const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
require('dotenv').config()

const CuentaModel = require('../../Configuraciones/models/cuentas.model')
const EntradaModel = require('../../Bandejas/models/entrada.model')
const getMenuFrontend = require('../../../helpers/Menu')
const jwtHelper = require('../../../helpers/Token')

exports.login = async (login, password) => {
    const account = await CuentaModel.findOne({ login }).populate('rol', 'privileges')
    if (!account) throw ({ status: 400, message: 'El Nombre de Usuario o Contraseña no son correctos' });
    if (!bcrypt.compareSync(password, account.password)) throw ({ status: 400, message: 'El Nombre de Usuario o Contraseña no son correctos' });
    if (account._id == process.env.ID_ROOT) {
        return {
            token: jwtHelper.createRootToken(account),
            resources: account.rol.privileges.map(privilege => privilege.resource)
        }
    }
    if (!account.activo || !account.funcionario) throw ({ status: 400, message: 'La cuenta ha sido deshabilitada' });
    return {
        token: jwtHelper.createToken(account),
        resources: account.rol.privileges.map(privilege => privilege.resource)
    }
}

exports.renewToken = async (id_account) => {
    const account = await CuentaModel.findById(id_account)
        .select('funcionario dependencia activo')
        .populate('dependencia', 'codigo')
        .populate('funcionario', 'nombre paterno materno cargo')
        .populate('rol', 'privileges')
    if (!account) throw ({ status: 401, message: 'la cuenta no existe' });
    if (account._id == process.env.ID_ROOT) {
        return {
            token: jwtHelper.createRootToken(account),
            resources: account.rol.privileges.map(privilege => privilege.resource),
            menu: getMenuFrontend(account.rol.privileges.map(privilege => privilege.resource))
        }
    }
    if (!account.activo || !account.funcionario) throw ({ status: 401, message: 'La cuenta ha sido deshabilitada' });
    const imbox = await EntradaModel.count({ 'receptor.cuenta': account._id })
    return {
        token: jwtHelper.createToken(account),
        resources: account.rol.privileges.map(privilege => privilege.resource),
        code: account.dependencia.codigo,
        imbox,
        menu: getMenuFrontend(account.rol.privileges.map(privilege => privilege.resource))
    }
}

