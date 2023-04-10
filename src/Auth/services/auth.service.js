
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
require('dotenv').config()

const CuentaModel = require('../../Configuraciones/models/cuentas.model')
const EntradaModel = require('../../Bandejas/models/entrada.model')
const getMenuFrontend = require('../../../helpers/Menu')

class CuentaService {
    async login(login, password) {
        const cuentaDB = await CuentaModel.findOne({ login })
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
        if (!cuentaDB) throw ({ status: 400, message: 'El Nombre de Usuario o Contraseña no son correctos' });
        if (!bcrypt.compareSync(password, cuentaDB.password)) throw ({ status: 400, message: 'El Nombre de Usuario o Contraseña no son correctos' });

        if (cuentaDB._id == process.env.ID_ROOT) {
            const token = jwt.sign({
                id_cuenta: cuentaDB._id,
                funcionario: {
                    nombre_completo: 'ADMINISTRADOR',
                    cargo: "Configuraciones"
                },
                resources: cuentaDB.rol.privileges.map(privilege => privilege.resource)
            }, process.env.JWT_SECRET, {
                expiresIn: '8h'
            })
            return { token, mails: 0 }
        }
        else {
            if (!cuentaDB.activo) throw ({ status: 400, message: 'La cuenta ha sido deshabilitada' });
            if (!cuentaDB.funcionario) throw ({ status: 400, message: 'La cuenta ha sido desvinculada' });
            const mails = await EntradaModel.count({ receptor: cuentaDB._id })
            const token = jwt.sign({
                id_cuenta: cuentaDB._id,
                funcionario: {
                    nombre_completo: `${cuentaDB.funcionario.nombre} ${cuentaDB.funcionario.paterno} ${cuentaDB.funcionario.materno}`,
                    cargo: cuentaDB.funcionario.cargo
                },
                resources: cuentaDB.rol.privileges.map(privilege => privilege.resource)
            }, process.env.JWT_SECRET, {
                expiresIn: '8h'
            })
            return { token, mails }
        }

    }

    async renewToken(id_cuenta) {
        const cuentaDB = await CuentaModel.findById(id_cuenta)
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
        let token
        if (cuentaDB._id == process.env.ID_ROOT) {
            token = jwt.sign({
                id_cuenta: cuentaDB._id,
                funcionario: {
                    nombre_completo: 'ADMINISTRADOR',
                    cargo: "Configuraciones"
                },
                resources: cuentaDB.rol.privileges.map(privilege => privilege.resource)
            }, process.env.JWT_SECRET, {
                expiresIn: '8h'
            })
        }
        else {
            if (!cuentaDB.activo) throw ({ status: 400, message: 'La cuenta ha sido deshabilitada' });
            if (!cuentaDB.funcionario) throw ({ status: 400, message: 'La cuenta ha sido desvinculada' });
            token = jwt.sign({
                id_cuenta: cuentaDB._id,
                funcionario: {
                    nombre_completo: `${cuentaDB.funcionario.nombre} ${cuentaDB.funcionario.paterno} ${cuentaDB.funcionario.materno}`,
                    cargo: cuentaDB.funcionario.cargo
                },
                resources: cuentaDB.rol.privileges.map(privilege => privilege.resource)
            }, process.env.JWT_SECRET, {
                expiresIn: '8h'
            })
        }
        return { token, Menu: getMenuFrontend(cuentaDB.rol.privileges.map(privilege => privilege.resource)) }
    }
}



module.exports = CuentaService