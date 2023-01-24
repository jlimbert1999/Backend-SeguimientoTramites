const { request, response } = require('express')
const Cuenta = require('../Configuraciones/cuentas/cuenta.model')
const bcrypt = require('bcrypt');
const jwt = require('../../helpers/generate_token')
const BandejaEntrada = require('../Seguimiento/bandejas/bandeja-entrada.model')
const { getMenuFrontend } = require('../../helpers/menu-frontend')

const login = async (req = request, res = response) => {
    try {
        const { login, password } = req.body
        const cuentaDB = await Cuenta.findOne({ login })
        if (!cuentaDB) {
            return res.status(400).send({
                ok: false,
                message: "El Login o Contraseña no son correctos"
            })
        }
        const validPassword = bcrypt.compareSync(password, cuentaDB.password)
        if (!validPassword) {
            return res.status(400).send({
                ok: false,
                message: "El Login o Contraseña no son correctos"
            })
        }
        await Cuenta.populate(cuentaDB, {
            path: 'dependencia',
            select: '_id',
            populate: {
                path: 'institucion',
                select: 'sigla -_id'
            }
        })
        await Cuenta.populate(cuentaDB, {
            path: 'funcionario',
            select: 'nombre paterno materno cargo'
        })
        let token
        if (!cuentaDB.funcionario && !cuentaDB.dependencia && cuentaDB.rol === "admin") {
            token = await jwt.generarToken(cuentaDB._id, '', 'Administrador', 'Configuraciones', cuentaDB.rol, '')
        }
        else {
            token = await jwt.generarToken(
                cuentaDB._id,
                cuentaDB.funcionario._id,
                `${cuentaDB.funcionario.nombre} ${cuentaDB.funcionario.paterno} ${cuentaDB.funcionario.materno ? cuentaDB.funcionario.materno : ''}`,
                cuentaDB.funcionario.cargo,
                cuentaDB.rol,
                cuentaDB.dependencia.institucion.sigla
            )
        }
        const number_mails = await BandejaEntrada.count({ receptor: cuentaDB ._id})
        res.send({
            ok: true,
            token,
            number_mails
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            ok: false,
            message: "error en login"
        })
    }
};


const renovar_token = async (req = request, res = response) => {
    try {
        const cuentaDB = await Cuenta.findById(req.id_cuenta).populate({
            path: 'dependencia',
            select: '_id',
            populate: {
                path: 'institucion',
                select: 'sigla -_id'
            }
        }).populate('funcionario', 'nombre paterno materno cargo')
        let token
        if (!cuentaDB.funcionario && !cuentaDB.dependencia && cuentaDB.rol === "admin") {
            token = await jwt.generarToken(cuentaDB._id, '', 'Administrador', 'Configuraciones', cuentaDB.rol, '')
        }
        else {
            token = await jwt.generarToken(
                cuentaDB._id,
                cuentaDB.funcionario._id,
                `${cuentaDB.funcionario.nombre} ${cuentaDB.funcionario.paterno} ${cuentaDB.funcionario.materno}`,
                cuentaDB.funcionario.cargo,
                cuentaDB.rol,
                cuentaDB.dependencia.institucion.sigla
            )
        }
        res.send({
            ok: true,
            token,
            Menu: getMenuFrontend(cuentaDB.rol)
        })
    } catch (error) {
        console.log('[SERVER]: Error renovar token:', error);
        res.status(500).send({
            ok: false,
            message: "Error sesion en el servidor"
        })
    }
}
module.exports = {
    login,
    renovar_token
}
