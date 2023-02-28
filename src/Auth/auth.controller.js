const { request, response } = require('express')
const Cuenta = require('../Configuraciones/cuentas/cuenta.model')
const bcrypt = require('bcrypt');
const jwt = require('../../helpers/generate_token')
const EntradaModel = require('../Bandejas/models/entrada.model')
const { getMenuFrontend } = require('../../helpers/menu-frontend')
const { ErrorResponse } = require('../../helpers/responses')

const login = async (req = request, res = response) => {
    try {
        const { login, password } = req.body
        const cuentaDB = await Cuenta.findOne({ login }).populate({
            path: 'dependencia',
            select: '_id codigo',
            populate: {
                path: 'institucion',
                select: 'sigla -_id'
            }
        }).populate('funcionario', 'nombre paterno materno cargo')

        if (!cuentaDB) return res.status(400).send({ ok: false, message: "El Login o Contraseña no son correctos" })
        if (!cuentaDB.activo) {
            return res.status(400).send({
                ok: false,
                message: "La cuenta ha sido deshabilitada"
            })
        }
        const validPassword = bcrypt.compareSync(password, cuentaDB.password)
        if (!validPassword) {
            return res.status(400).send({
                ok: false,
                message: "El Login o Contraseña no son correctos"
            })
        }

        let token = await jwt.generarToken(cuentaDB)
        const number_mails = await EntradaModel.count({ receptor: cuentaDB._id })
        return res.send({
            ok: true,
            token,
            number_mails
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}


const renovar_token = async (req = request, res = response) => {
    try {
        const cuentaDB = await Cuenta.findById(req.id_cuenta).populate({
            path: 'dependencia',
            select: '_id codigo',
            populate: {
                path: 'institucion',
                select: 'sigla -_id'
            }
        }).populate('funcionario', 'nombre paterno materno cargo')
        if (!cuentaDB.activo) {
            return res.status(400).send({
                ok: false,
                message: "La cuenta ha sido deshabilitada"
            })
        }
        let token = await jwt.generarToken(cuentaDB)
        return res.send({
            ok: true,
            token,
            Menu: getMenuFrontend(cuentaDB.rol)
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}
module.exports = {
    login,
    renovar_token
}
