const Cuenta = require('../cuentas/cuenta.model')
const { request, response } = require('express')
const bcrypt = require('bcrypt');

const getAccount = async (req = request, res = response) => {
    try {
        const cuenta = await Cuenta.findOne({ _id: req.id_cuenta })
            .select('login')
            .populate('funcionario', 'nombre cargo telefono dni -_id')
            .populate({
                path: 'dependencia',
                select: 'nombre -_id',
                populate: {
                    path: 'institucion',
                    select: 'nombre -_id'
                }
            })
        res.json({
            ok: true,
            cuenta
        });
    } catch (error) {
        console.log("[SERVER]: error (obtener obtener detalles cuenta)", error);
        res.json({
            ok: false,
            message: "Error al obtener cuenta",
        });
    }
};
const editAccount = async (req = request, res = response) => {
    let { login, password } = req.body
    try {
        const cuentaDB = await Cuenta.findById(req.id_cuenta)
        if (!cuentaDB) {
            return res.status(500).json({
                ok: false,
                message: 'La sesion no es correcta'
            })
        }
        if (cuentaDB.login !== login) {
            const existeLogin = await Cuenta.findOne({ login })
            if (existeLogin) {
                return res.status(400).json({
                    ok: false,
                    message: 'login introducido ya existe'
                })
            }
        }
        if (password) {
            const salt = bcrypt.genSaltSync()
            password = password.toString()
            req.body.password = bcrypt.hashSync(password, salt)
        }
        await Cuenta.findByIdAndUpdate(req.id_cuenta, req.body)
        return res.json({
            ok: true,
            message:'Se actualizo la cuenta correctamente'
        });
    } catch (error) {
        console.log("[SERVER]: error (editar cuenta)", error);
        res.json({
            ok: false,
            message: "Error al editar la cuenta",
        });
    }
};


module.exports = {
    getAccount,
    editAccount
}
