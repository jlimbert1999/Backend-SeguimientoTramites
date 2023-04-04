
const bcrypt = require('bcrypt');
const CuentaModel = require('../../Configuraciones/models/cuentas.model')
const EntradaModel = require('../../Bandejas/models/entrada.model')
const jwt = require('../../../helpers/generate_token')
const { getMenuFrontend } = require('../../../helpers/menu-frontend')

class CuentaService {
    async login(login, password) {
        const cuentaDB = await CuentaModel.findOne({ login }).populate({
            path: 'dependencia',
            select: '_id codigo',
            populate: {
                path: 'institucion',
                select: 'sigla -_id'
            }
        }).populate('funcionario', 'nombre paterno materno cargo')
        if (!cuentaDB) throw ({ status: 400, message: 'El Nombre de Usuario o Contraseña no son correctos' });
        if (!cuentaDB.activo) throw ({ status: 400, message: 'La cuenta ha sido deshabilitada' });
        if (!cuentaDB.funcionario && !cuentaDB.rol.includes('ADMINISTRADOR')) throw ({ status: 400, message: 'La cuenta ha sido desvinculada' });
        const validPassword = bcrypt.compareSync(password, cuentaDB.password)
        if (!validPassword) throw ({ status: 400, message: 'El Nombre de Usuario o Contraseña no son correctos' });
        let token = await jwt.generarToken(cuentaDB)
        const number_mails = await EntradaModel.count({ receptor: cuentaDB._id })
        return { token, number_mails }
    }


    async renovar_token(id_cuenta) {
        const cuentaDB = await CuentaModel.findById(id_cuenta).populate({
            path: 'dependencia',
            select: '_id codigo',
            populate: {
                path: 'institucion',
                select: 'sigla -_id'
            }
        }).populate('funcionario', 'nombre paterno materno cargo')
        let token = await jwt.generarToken(cuentaDB)
        return { token, Menu: getMenuFrontend(cuentaDB.rol) }
    }
}



module.exports = CuentaService