const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
require('dotenv').config()

const CuentaModel = require('../../Configuraciones/models/cuentas.model')
const EntradaModel = require('../../Bandejas/models/entrada.model')
const getMenuFrontend = require('../../../helpers/Menu')
const jwtHelper = require('../../../helpers/Token')

exports.login = async (login, password) => {
    const account = await CuentaModel.findOne({ login })
        .populate({
            path: 'dependencia',
            select: '_id codigo',
            populate: {
                path: 'institucion',
                select: 'sigla -_id'
            }
        })
        .populate('funcionario', 'nombre paterno materno cargo')
        .populate('rol', 'privileges')
    if (!account) throw ({ status: 400, message: 'El Nombre de Usuario o Contraseña no son correctos' });
    if (!bcrypt.compareSync(password, account.password)) throw ({ status: 400, message: 'El Nombre de Usuario o Contraseña no son correctos' });
    if (account._id == process.env.ID_ROOT) {
        return { token: jwtHelper.createRootToken(account), imbox: 0 }
    }
    if (!account.activo || !account.funcionario) throw ({ status: 400, message: 'La cuenta ha sido deshabilitada' });
    const imbox = await EntradaModel.count({ receptor: account._id })
    return { token: jwtHelper.createToken(account), imbox }
}

exports.renewToken = async (id_account) => {
    const account = await CuentaModel.findById(id_account)
        .populate({
            path: 'dependencia',
            select: '_id codigo',
            populate: {
                path: 'institucion',
                select: 'sigla -_id'
            }
        })
        .populate('funcionario', 'nombre paterno materno cargo')
        .populate('rol', 'privileges')
    if (!account) throw ({ status: 401, message: 'la cuenta no existe' });
    if (account._id == process.env.ID_ROOT) {
        return { token: jwtHelper.createRootToken(account), menu: getMenuFrontend(account.rol.privileges.map(privilege => privilege.resource)) }
    }
    if (!account.activo || !account.funcionario) throw ({ status: 401, message: 'La cuenta ha sido deshabilitada' });
    return { token: jwtHelper.createToken(account), menu: getMenuFrontend(account.rol.privileges.map(privilege => privilege.resource)) }
}
