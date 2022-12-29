const { request, response } = require('express')
const Cuenta = require('../Configuraciones/cuentas/cuenta.model')
const bcrypt = require('bcrypt');
const jwt = require('../../helpers/generate_token')
const { getMenuFrontend } = require('../../helpers/menu-frontend')

const login = async (req = request, res = response) => {
    try {
        const { login, password } = req.body
        const cuentaDB = await Cuenta.findOne({ login }).populate({
            path: 'dependencia',
            select: 'nombre codigo -_id',
            populate: {
                path: 'institucion',
                select: 'sigla -_id'
            }
        }).populate('funcionario', 'nombre paterno materno cargo')
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
        let token, nombre_completo
        if (!cuentaDB.funcionario && !cuentaDB.dependencia && cuentaDB.rol === "admin") {
            token = await jwt.generarToken(cuentaDB._id, null, "Administrador", 'Configuraciones', cuentaDB.rol, '', '', '')
        }
        else {
            nombre_completo = `${cuentaDB.funcionario.nombre} ${cuentaDB.funcionario.paterno} ${cuentaDB.funcionario.materno ? cuentaDB.funcionario.materno : ''}`
            token = await jwt.generarToken(
                cuentaDB._id,
                cuentaDB.funcionario._id,
                nombre_completo,
                cuentaDB.funcionario.cargo,
                cuentaDB.rol,
                cuentaDB.dependencia.nombre,
                cuentaDB.dependencia.institucion.sigla,
                cuentaDB.dependencia.codigo)
        }
        res.send({
            ok: true,
            token
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
            select: 'nombre codigo -_id',
            populate: {
                path: 'institucion',
                select: 'sigla -_id'
            }
        }).populate('funcionario', 'nombre paterno materno cargo')
        let token, nombre_completo
        if (!cuentaDB.funcionario && !cuentaDB.dependencia && cuentaDB.rol === "admin") {
            token = await jwt.generarToken(cuentaDB._id, null, "Administrador", 'Configuraciones', cuentaDB.rol, '', '', '')
        }
        else {
            nombre_completo = `${cuentaDB.funcionario.nombre} ${cuentaDB.funcionario.paterno} ${cuentaDB.funcionario.materno ? cuentaDB.funcionario.materno : ''}`
            token = await jwt.generarToken(
                cuentaDB._id,
                cuentaDB.funcionario._id,
                nombre_completo,
                cuentaDB.funcionario.cargo,
                cuentaDB.rol,
                cuentaDB.dependencia.nombre,
                cuentaDB.dependencia.institucion.sigla,
                cuentaDB.dependencia.codigo)
        }
        res.send({
            ok: true,
            token,
            Menu: getMenuFrontend(cuentaDB.rol)
        })
    } catch (error) {
        console.log('[SERVER]: error renovar token:', error);
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
