const Cuenta = require('../../Configuraciones/models/cuentas.model')
const { request, response } = require('express')
const bcrypt = require('bcrypt');
const TramiteExterno = require('../../Tramites/models/externo.model')
const TramiteInterno = require('../../Tramites/models/interno.model')
const BandejaEntrada = require('../../Bandejas/models/entrada.model')
const BandejaSalida = require('../../Bandejas/models/salida.model')
const { ErrorResponse } = require('../../../helpers/responses')

const getAccount = async (req = request, res = response) => {
    try {
        const cuenta = await Cuenta.findOne({ _id: req.id_cuenta })
            .select('login')
            .populate('funcionario', 'nombre paterno materno cargo telefono dni -_id')
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
            message: 'Se actualizo la cuenta correctamente'
        });
    } catch (error) {
        console.log("[SERVER]: error (editar cuenta)", error);
        res.json({
            ok: false,
            message: "Error al editar la cuenta",
        });
    }
};
const getWorkDetails = async (req = request, res = response) => {
    try {
        const id = req.params.id
        const { rol } = req.query
        let [total_internos, total_entrada, total_salida] = await Promise.all(
            [
                TramiteInterno.count({ cuenta: id }),
                BandejaEntrada.count({ receptor: id }),
                BandejaSalida.count({ 'emisor.cuenta': id })
            ]
        )
        if (rol === 'RECEPCION') {
            let total_externos = await TramiteExterno.count({ cuenta: id })
            return res.json({
                ok: true,
                total_externos,
                total_internos,
                total_entrada,
                total_salida
            })
        }
        return res.json({
            ok: true,
            total_internos,
            total_entrada,
            total_salida
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
};

module.exports = {
    getAccount,
    editAccount,
    getWorkDetails
}
