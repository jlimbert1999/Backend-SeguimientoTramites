const bcrypt = require('bcrypt');
require('dotenv').config()
const { default: mongoose } = require("mongoose");

const CuentaModel = require('../models/cuentas.model')
const FuncionarioModel = require('../../Configuraciones/models/funcionarios.model')
const DependenciaModel = require('../models/dependencias.model')
const { ExternoModel } = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const EntradaModel = require('../../Bandejas/models/entrada.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const RolModel = require('../models/roles.model')

class CuentaService {
    async getRoles() {
        const roles = RolModel.find({}).select('role')
        return roles
    }
    async getDependencias(id_institucion) {
        const dependencias = DependenciaModel.find({ institucion: id_institucion, activo: true })
        return dependencias
    }
    async get(limit, offset) {
        offset = parseInt(offset) ? offset : 0
        limit = parseInt(limit) ? limit : 10
        offset = offset * limit
        const [cuentas, length] = await Promise.all(
            [
                CuentaModel.find({ _id: { $ne: process.env.ID_ROOT } }).select('login rol activo').sort({ _id: -1 }).skip(offset).limit(limit).populate({
                    path: 'dependencia',
                    select: 'nombre -_id',
                    populate: {
                        path: 'institucion',
                        select: 'sigla -_id'
                    }
                }).populate('funcionario'),
                CuentaModel.count({ _id: { $ne: process.env.ID_ROOT } })
            ]
        )
        return { cuentas, length }
    }
    async add(cuenta, funcionario) {
        const existeDni = await FuncionarioModel.findOne({ dni: funcionario.dni })
        if (existeDni) {
            throw ({ status: 400, message: 'El DNI introducido ya existe' });
        }
        const existeLogin = await CuentaModel.findOne({ login: cuenta.login })
        if (existeLogin) {
            throw ({ status: 400, message: 'El login introducido ya existe' });
        }
        // marcar como con cuenta
        funcionario['cuenta'] = true
        const newUser = new FuncionarioModel(funcionario)
        const userdb = await newUser.save()

        const salt = bcrypt.genSaltSync();
        cuenta.password = bcrypt.hashSync(cuenta.password.toString(), salt)
        cuenta.funcionario = userdb._id
        const newCuenta = new CuentaModel(cuenta)
        let accountdb = await newCuenta.save()
        await CuentaModel.populate(accountdb, [
            {
                path: 'dependencia',
                select: 'nombre -_id',
                populate: {
                    path: 'institucion',
                    select: 'sigla -_id'
                }
            },
            { path: 'funcionario' }
        ])
        accountdb = accountdb.toObject()
        delete accountdb.password
        delete accountdb.__v
        return accountdb
    }
    async edit(id_cuenta, data) {
        const cuentaDB = await CuentaModel.findById(id_cuenta)
        if (!cuentaDB) {
            throw ({ status: 400, message: 'La cuenta no existe' });
        }
        if (cuentaDB.login !== data.login) {
            const existeLogin = await CuentaModel.findOne({ login: data.login })
            if (existeLogin) {
                throw ({ status: 400, message: 'El login introducido ya existe' });
            }
        }
        // if (data.password) {
        //     const salt = bcrypt.genSaltSync()
        //     data.password = data.password.toString()
        //     data.password = bcrypt.hashSync(data.password, salt)
        // }
        let cuenta = await CuentaModel.findByIdAndUpdate(id_cuenta, data, { new: true })
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
        return cuenta
    }

    async search(limit, offset, text, institucion, dependencia) {
        limit = parseInt(limit) || 10
        offset = parseInt(offset) || 0
        offset = offset * limit
        let query = {}
        if (institucion) {
            Object.assign(query, { 'dependencia.institucion._id': mongoose.Types.ObjectId(institucion) })
            if (dependencia) {
                Object.assign(query, { 'dependencia._id': mongoose.Types.ObjectId(dependencia) })
            }
        }
        if (text) {
            Object.assign(query, {
                $or: [
                    { "funcionario.fullname": new RegExp(text, 'i') },
                    { "funcionario.cargo": new RegExp(text, 'i') },
                    { "funcionario.dni": new RegExp(text, 'i') }
                ],
            })
        }
        const data = await CuentaModel.aggregate([
            {
                $lookup: {
                    from: "dependencias",
                    localField: "dependencia",
                    foreignField: "_id",
                    as: "dependencia",
                },
            },
            {
                $unwind: {
                    path: "$dependencia",
                },
            },
            {
                $project: {
                    password: 0,
                    __v: 0,
                    'dependencia.activo': 0,
                    'dependencia.__v': 0,
                    'dependencia.codigo': 0,
                    'dependencia.sigla': 0,
                }
            },
            {
                $lookup: {
                    from: "instituciones",
                    localField: "dependencia.institucion",
                    foreignField: "_id",
                    as: "dependencia.institucion",
                },
            },
            {
                $unwind: {
                    path: "$dependencia.institucion",
                },
            },
            {
                $project: {
                    'dependencia.institucion.activo': 0,
                    'dependencia.institucion.__v': 0,
                }
            },
            {
                $lookup: {
                    from: "funcionarios",
                    localField: "funcionario",
                    foreignField: "_id",
                    as: "funcionario",
                },
            },
            {
                $unwind: {
                    path: "$funcionario",
                },
            },
            {
                $project: {
                    'funcionario.activo': 0,
                    'funcionario.__v': 0,
                }
            },
            {
                $addFields: {
                    "funcionario.fullname": {
                        $concat: [
                            "$funcionario.nombre",
                            " ",
                            { $ifNull: ["$funcionario.paterno", ""] },
                            " ",
                            { $ifNull: ["$funcionario.materno", ""] },
                        ],
                    },
                },
            },
            {
                $match: query
            },
            {
                $facet: {
                    paginatedResults: [{ $skip: offset }, { $limit: limit }],
                    totalCount: [
                        {
                            $count: 'count'
                        }
                    ]
                }
            }
        ]);
        const cuentas = data[0].paginatedResults
        const length = data[0].totalCount[0] ? data[0].totalCount[0].count : 0
        return { cuentas, length }
    }

    async getDetails(id_cuenta) {
        let details = {}
        let account = await CuentaModel.findById(id_cuenta).select('rol').populate('rol', 'privileges')
        account = account.rol.privileges.map(privilege => privilege.resource)
        if (account.includes('externos')) {
            const externos = await ExternoModel.count({ cuenta: id_cuenta })
            Object.assign(details, { externos })
        }
        if (account.includes('internos')) {
            const internos = await InternoModel.count({ cuenta: id_cuenta })
            Object.assign(details, { internos })
        }
        if (account.includes('entradas')) {
            const entradas = await EntradaModel.count({ 'receptor.cuenta': id_cuenta })
            Object.assign(details, { entradas })
        }
        if (account.includes('salidas')) {
            const salidas = await SalidaModel.count({ 'emisor.cuenta': id_cuenta })
            Object.assign(details, {salidas})
        }
        return details

    }
    async getUserAssign(text) {
        const regex = new RegExp(text, 'i')
        const funcionarios = await FuncionarioModel.aggregate([
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
        return funcionarios
    }

};





module.exports = CuentaService