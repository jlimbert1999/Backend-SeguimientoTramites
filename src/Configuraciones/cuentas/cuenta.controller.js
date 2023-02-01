const { request, response } = require('express')
const Cuenta = require('./cuenta.model')
const Cuenta_Detalles = require('./cuenta-detalles.model')
const Usuario = require('../usuarios/usuarios.model')
const Dependencia = require('../dependencias/dependencias.model')
const Institucion = require('../instituciones/instituciones.model')
const bcrypt = require('bcrypt');
const { ErrorResponse } = require('../../../helpers/responses')

const add = async (req = request, res = response) => {
    const { cuenta, funcionario } = req.body
    try {
        const existeDni = await Usuario.findOne({ dni: funcionario.dni })
        if (existeDni) {
            return res.status(400).json({
                ok: false,
                message: 'El dni introducido ya existe'
            })
        }
        const existeLogin = await Cuenta.findOne({ login: cuenta.login })
        if (existeLogin) {
            return res.status(400).json({
                ok: false,
                message: 'El login introducido ya existe'
            })
        }
        // marcar como con cuenta
        funcionario.cuenta = true
        const newUser = new Usuario(funcionario)
        let userdb = await newUser.save()

        const salt = bcrypt.genSaltSync();
        cuenta.password = bcrypt.hashSync(cuenta.password.toString(), salt)
        cuenta.funcionario = userdb._id
        const newCuenta = new Cuenta(cuenta)
        let accountdb = await newCuenta.save()
        await Cuenta.populate(accountdb, {
            path: 'dependencia',
            select: 'nombre -_id',
            populate: {
                path: 'institucion',
                select: 'sigla -_id'
            }
        })
        await Cuenta.populate(accountdb, { path: 'funcionario' })
        accountdb = accountdb.toObject()
        delete accountdb.password
        delete accountdb.__v

        return res.json({
            ok: true,
            cuenta: accountdb
        })
    } catch (error) {
        return ErrorResponse(res, error)

    }
};

const get = async (req = request, res = response) => {
    let { limit, offset } = req.query;
    offset = parseInt(offset) || 0;
    limit = parseInt(limit) || 10;
    offset = limit * offset
    try {
        const [cuentas, total] = await Promise.all(
            [
                Cuenta.find({ rol: { $ne: 'admin' } }).select('login rol activo').sort({ _id: -1 }).skip(offset).limit(limit).populate({
                    path: 'dependencia',
                    select: 'nombre -_id',
                    populate: {
                        path: 'institucion',
                        select: 'sigla -_id'
                    }
                }).populate('funcionario'),
                Cuenta.count({ rol: { $ne: 'admin' } })
            ]
        )
        return res.json({
            ok: true,
            cuentas,
            total
        });
    } catch (error) {
        return ErrorResponse(res, error)
    }
};

const editar_cuenta = async (req = request, res = response) => {
    let { login, password } = req.body
    const id_cuenta = req.params.id
    try {
        const cuentaDB = await Cuenta.findById(id_cuenta)
        if (!cuentaDB) {
            return res.status(400).json({
                ok: false,
                message: 'La cuenta no existe'
            })
        }
        if (cuentaDB.login !== login) {
            const existeLogin = await Cuenta.findOne({ login })
            if (existeLogin) {
                return res.status(400).json({
                    ok: false,
                    message: 'El login introducido ya existe'
                })
            }
        }
        if (password) {
            const salt = bcrypt.genSaltSync()
            password = password.toString()
            req.body.password = bcrypt.hashSync(password, salt)
        }
        let cuenta = await Cuenta.findByIdAndUpdate(id_cuenta, req.body, { new: true })
            .populate({
                path: 'dependencia',
                select: 'nombre -_id',
                populate: {
                    path: 'institucion',
                    select: 'sigla -_id'
                }
            })
            .populate('funcionario')
        cuenta = cuenta.toObject()
        delete cuenta.password
        delete cuenta.__v
        res.json({
            ok: true,
            cuenta
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}

const search = async (req = request, res = response) => {
    const text = req.params.text
    let { limit, offset, type } = req.query;
    offset = parseInt(offset) || 0;
    limit = parseInt(limit) || 10;
    offset = offset * limit
    try {
        if (!text) {
            return res.status(400).json({
                ok: false,
                message: 'Parametros invalidos para busqueda de usuarios'
            })
        }
        let cuentas, total
        const regex = new RegExp(text, 'i')
        switch (type) {
            case 'funcionario':
                cuentas = await Cuenta.aggregate([
                    {
                        $lookup: {
                            from: "funcionarios",
                            localField: "funcionario",
                            foreignField: "_id",
                            as: "funcionario"
                        }
                    },
                    {
                        $unwind: {
                            path: "$funcionario"
                        }
                    },
                    {
                        $project: {
                            "funcionario.__v": 0,
                            __v: 0,
                            password: 0
                        }
                    },
                    {
                        $addFields: {
                            "funcionario.fullname": {
                                $concat: ["$funcionario.nombre", " ", { $ifNull: ["$funcionario.paterno", ""] }, " ", { $ifNull: ["$funcionario.materno", ""] }]
                            }
                        },
                    },
                    {
                        $match: {
                            $or: [
                                { "funcionario.fullname": regex },
                                { "funcionario.cargo": regex },
                                { "funcionario.dni": regex }
                            ]
                        }
                    },
                    {
                        $project: {
                            "funcionario.fullname": 0
                        }
                    },
                    { $skip: offset },
                    { $limit: limit }
                ])

                total = await Cuenta.aggregate([
                    {
                        $lookup: {
                            from: "funcionarios",
                            localField: "funcionario",
                            foreignField: "_id",
                            as: "funcionario"
                        }
                    },
                    {
                        $unwind: {
                            path: "$funcionario"
                        }
                    },
                    {
                        $project: {
                            "funcionario.nombre": 1,
                            "funcionario.paterno": 1,
                            "funcionario.materno": 1
                        }
                    },
                    {
                        $addFields: {
                            "funcionario.fullname": {
                                $concat: ["$funcionario.nombre", " ", { $ifNull: ["$funcionario.paterno", ""] }, " ", { $ifNull: ["$funcionario.materno", ""] }]
                            }
                        },
                    },
                    {
                        $match: {
                            $or: [
                                { "funcionario.fullname": regex },
                                { "funcionario.cargo": regex },
                                { "funcionario.dni": regex }
                            ]
                        }
                    },
                    { $count: 'cuentas' }
                ])
                total = total[0] ? total[0].cuentas : 0
                break;
            case 'dependencia':
                cuentas = await Cuenta.find({ dependencia: text }).skip(offset).limit(limit)
                total = await Cuenta.count({ dependencia: text })
                await Cuenta.populate(cuentas, { path: 'funcionario' })
                break;
            default:
                cuentas = []
                total = 0
                break;
        }
        await Cuenta.populate(cuentas, {
            path: 'dependencia',
            select: 'nombre -_id',
            populate: {
                path: 'institucion',
                select: 'sigla -_id'
            }
        })

        return res.json({
            ok: true,
            cuentas,
            total
        });
    } catch (error) {
        return ErrorResponse(res, error)
    }
};

const assingAccount = async (req = request, res = response) => {
    const id_cuenta = req.params.id
    const { id_oldUser, id_newUser } = req.body
    try {
        await Promise.all([
            Cuenta.findByIdAndUpdate(id_cuenta, { funcionario: id_newUser, activo: true }),
            Usuario.findByIdAndUpdate(id_newUser, { cuenta: true })
        ])
        if (id_oldUser) {
            await Usuario.findByIdAndUpdate(id_oldUser, { cuenta: false })
        }
        res.json({
            ok: true,
            message: 'Cuenta asignada correctamente'
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}

const addAccountLink = async (req = request, res = response) => {
    let cuenta = req.body
    try {
        const existeLogin = await Cuenta.findOne({ login: cuenta.login })
        if (existeLogin) {
            return res.status(400).json({
                ok: false,
                message: 'El login introducido ya existe'
            })
        }
        await Usuario.findByIdAndUpdate(cuenta.funcionario, { cuenta: true })
        const salt = bcrypt.genSaltSync();
        cuenta.password = bcrypt.hashSync(cuenta.password.toString(), salt)
        const newCuenta = new Cuenta(cuenta)
        let cuentaDB = await newCuenta.save()

        await Cuenta.populate(cuentaDB, {
            path: 'dependencia',
            select: 'nombre -_id',
            populate: {
                path: 'institucion',
                select: 'sigla -_id'
            }
        })
        await Cuenta.populate(cuentaDB, {
            path: 'funcionario'
        })
        cuentaDB = cuentaDB.toObject()
        delete cuentaDB.password
        delete cuentaDB.__v

        return res.json({
            ok: true,
            cuenta: cuentaDB
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }

}
const obtener_instituciones = async (req = request, res = response) => {
    try {
        const instituciones = await Institucion.find({ activo: true }, 'nombre')
        res.send({
            ok: true,
            instituciones
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: 'error al obtener instituciones para cuentas'
        })
    }

}
const getDependencias = async (req = request, res = response) => {
    const id = req.params.id_institucion
    try {
        const dependencias = await Dependencia.find({ activo: true, institucion: id }, 'nombre')
        res.send({
            ok: true,
            dependencias
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: 'error al obtener dependencias para cuentas'
        })
    }

}
const obtener_funcionarios_asignacion = async (req = request, res = response) => {
    try {
        const funcionarios = await Usuario.find({ cuenta: false, activo: true }, 'nombre paterno materno cargo dni')
        res.send({
            ok: true,
            funcionarios
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: 'error al obtener funcionarios para asignar cuentas'
        })
    }
}

const getUsersforAssign = async (req = request, res = response) => {
    const text = req.params.text
    if (!text || text === '') {
        return res.status(400).json({
            ok: false,
            message: 'Parametros incorrectos en busqueda de funcionarios para asignar'
        })
    }
    try {
        const regex = new RegExp(text, 'i')
        const users = await Usuario.aggregate([
            {
                $addFields: {
                    fullname: {
                        $concat: ["$nombre", " ", { $ifNull: ["$paterno", ""] }, " ", { $ifNull: ["$materno", ""] }]
                    }
                },
            },
            {
                $match: {
                    cuenta: false,
                    $or: [
                        { fullname: regex },
                        { dni: regex },
                        { cargo: regex }

                    ]
                }
            },
            { $project: { __v: 0 } },
            { $limit: 5 }
        ]);

        return res.send({
            ok: true,
            users
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}

const unlinkUser = async (req = request, res = response) => {
    const id_cuenta = req.params.id
    try {
        let cuenta = await Cuenta.findById(id_cuenta)
        if (!cuenta.funcionario) {
            res.status(400).send({
                ok: false,
                message: 'La cuenta ya fue desvinculada'
            })
        }
        // unlink user and disable account
        await Cuenta.findByIdAndUpdate({ _id: id_cuenta }, { activo: false, $unset: { funcionario: 1 } })

        // mark user free
        await Usuario.findByIdAndUpdate(cuenta.funcionario, { cuenta: false })
        res.send({
            ok: true,
            message: 'La cuenta fue desvinculada'
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}

const disabled = async (req = request, res = response) => {
    const id_cuenta = req.params.id
    try {
        let cuentaDB = await Cuenta.findById(id_cuenta)
        if (!cuentaDB.funcionario) {
            return res.status(400).json({
                ok: false,
                message: 'La cuenta esta desabilitada hasta una nueva asignacion'
            })
        }
        await Cuenta.findByIdAndUpdate(id_cuenta, { activo: !cuentaDB.activo })
        res.send({
            ok: true,
            activo: !cuentaDB.activo
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}




module.exports = {
    add,
    get,
    editar_cuenta,
    search,

    assingAccount,
    addAccountLink,

    obtener_instituciones,
    getDependencias,
    obtener_funcionarios_asignacion,

    getUsersforAssign,
    unlinkUser,
    disabled
}