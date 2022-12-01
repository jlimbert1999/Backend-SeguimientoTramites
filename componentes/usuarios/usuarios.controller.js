const { request, response } = require('express')
const Usuario = require('./usuarios.model')
const Cuenta_Detalles = require('../cuentas/cuenta-detalles.model')
const agregar_usuario = async (req = request, res = response) => {
    const { dni } = req.body
    try {
        const existeDni = await Usuario.findOne({ dni })
        if (existeDni) {
            return res.status(400).json({
                ok: false,
                message: 'El dni introducido ya existe'
            })
        }
        const newUser = new Usuario(req.body)
        const userdb = await newUser.save()
        res.json({
            ok: true,
            funcionario: userdb
        })

    } catch (error) {
        console.log('[SERVER]: error (agregar funcionarios)', error);
        res.status(500).json({
            ok: true,
            message: 'error al registrar funcionario'
        })

    }

}
const editar_usuario = async (req = request, res = response) => {
    const { dni } = req.body
    const id_funcionario = req.params.id
    try {
        const usuariodb = await Usuario.findById(id_funcionario)
        if (!usuariodb) {
            return res.status(400).json({
                ok: false,
                message: 'El id del funcionario no existe'
            })

        }
        if (usuariodb.dni !== dni) {
            const existeDni = await Usuario.findOne({ dni })
            if (existeDni) {
                return res.status(400).json({
                    ok: false,
                    message: 'El dni introducido ya existe'
                })
            }
        }
        const funcionario = await Usuario.findByIdAndUpdate(id_funcionario, req.body, { new: true })
        res.json({
            ok: true,
            funcionario
        })

    } catch (error) {
        console.log('[SERVER]: error (editar funcionarios)', error);
        res.status(500).json({
            ok: true,
            message: 'error al editar funcionario'
        })

    }
}



const obtener_usuarios = async (req = request, res = response) => {
    try {
        const [funcionarios, total] = await Promise.all(
            [
                Usuario.find({}).sort({ _id: -1 }),
                Usuario.count()
            ]
        )
        res.json({
            ok: true,
            funcionarios,
            message: 'se completo',
            total
        })

    } catch (error) {
        console.log('[SERVER]: error (obtener funcionarios)', error);
        res.status(500).json({
            ok: true,
            message: 'error al obtene funcionario'
        })

    }
}

const buscar_Usuarios = async (req = request, res = response) => {
    let { pageIndex, rows } = req.query
    pageIndex = parseInt(pageIndex) || 0
    rows = parseInt(rows) || 10
    pageIndex = rows * pageIndex
    const termino = req.params.termino
    try {
        const regex = new RegExp(termino, 'i')
        const [funcionarios, total] = await Promise.all(
            [
                Usuario.find({ $or: [{ nombre: regex }, { dni: regex }, { cargo: regex }] }).skip(pageIndex).limit(rows),
                Usuario.find({ $or: [{ nombre: regex }, { dni: regex }, { cargo: regex }] }).count()
            ]
        )
        res.json({
            ok: true,
            funcionarios,
            total
        })
    } catch (error) {
        console.log('[Server]: Error (buscar funcionario) =>', error);
        res.status(400).send({
            ok: false,
            message: 'Error al buscar funcionario'
        })
    }
};
const cambiar_situacion_usuario = async (req = request, res = response) => {
    const { activo } = req.body
    const id_funcionario = req.params.id
    try {
        const UsuariosDB = await Usuario.findOne({ _id: id_funcionario })
        if (UsuariosDB.cuenta) {
            return res.status(400).json({
                ok: false,
                message: 'El funcionario esta asignado a una cuenta'
            })
        }
        const funcionario = await Usuario.findByIdAndUpdate(id_funcionario, { activo }, { new: true })
        res.json({
            ok: true,
            funcionario
        })

    } catch (error) {
        console.log('[SERVER]: error (cambiar situacion funcionario)', error);
        res.status(500).json({
            ok: true,
            message: 'cambiar situacion funcionario'
        })

    }
}
const agregar_multiples_usuarios = async (req = request, res = response) => {
    const { funcionarios } = req.body
    try {
        const all_dni = funcionarios.map(funcionario => funcionario.dni)
        let existeDni = await Usuario.findOne({ "dni": { "$in": all_dni } })
        if (existeDni) {
            return res.status(400).json({
                ok: false,
                message: `El Dni:${existeDni.dni} del funcionario ${existeDni.nombre} ya existe`
            })
        }
        const UsersDb = await Usuario.insertMany(funcionarios)
        res.json({
            ok: true,
            funcionarios: UsersDb
        })

    } catch (error) {
        console.log('[SERVER]: error (cargar funcionarios)', error);
        res.status(500).json({
            ok: true,
            message: 'error cargar funcionarios para registro'
        })

    }
}

const obtener_detalles_movilidad = async (req = request, res = response) => {
    const id_funcionario = req.params.id_funcionario
    try {
        const detalles = await Cuenta_Detalles.find({ id_funcionario }).sort({ fecha: -1 })
        res.json({
            ok: true,
            detalles
        })

    } catch (error) {
        console.log('[SERVER]: error (obtener detalles movilidad funcionario)', error);
        res.status(500).json({
            ok: true,
            message: 'Error en el servidor'
        })

    }
}

module.exports = {
    agregar_usuario,
    agregar_multiples_usuarios,
    editar_usuario,
    obtener_usuarios,
    buscar_Usuarios,
    cambiar_situacion_usuario,
    obtener_detalles_movilidad
}