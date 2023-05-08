const FuncionarioModel = require('../models/funcionarios.model')
const { default: mongoose } = require("mongoose");

exports.get = async (limit, offset) => {
    const [funcionarios, length] = await Promise.all(
        [
            FuncionarioModel.find({}).sort({ _id: -1 }).skip(offset).limit(limit),
            FuncionarioModel.count()
        ]
    )
    return { funcionarios, length }
}
exports.add = async (funcionario) => {
    const { dni } = funcionario
    const existeDni = await FuncionarioModel.findOne({ dni })
    if (existeDni) {
        throw ({ status: 400, message: 'El dni introducido ya existe' });
    }
    const funcionarioDB = new FuncionarioModel(funcionario)
    const newFuncionario = await funcionarioDB.save()
    return newFuncionario
}
exports.edit = async (id_funcionario, funcionario) => {
    const { dni } = funcionario
    const funcionarioDB = await FuncionarioModel.findById(id_funcionario)
    if (!funcionarioDB) {
        throw ({ status: 400, message: 'El funcionario no existe' });
    }
    if (funcionarioDB.dni !== dni) {
        const existeDni = await FuncionarioModel.findOne({ dni })
        if (existeDni) {
            throw ({ status: 400, message: 'El dni introducido ya existe' });
        }
    }
    const newFuncionario = await FuncionarioModel.findByIdAndUpdate(id_funcionario, funcionario, { new: true })
    return newFuncionario
}
exports.delete = async (id_funcionario) => {
    const funcionarioDB = await FuncionarioModel.findOne({ _id: id_funcionario })
    if (!funcionarioDB) {
        throw ({ status: 400, message: 'El funcionario no existe' });
    }
    if (funcionarioDB.cuenta) {
        throw ({ status: 400, message: 'El funcionario esta asignado a una cuenta' });
    }
    const newFuncionario = await FuncionarioModel.findByIdAndUpdate(id_funcionario, { activo: !funcionarioDB.activo }, { new: true })
    return newFuncionario
}
exports.search = async (limit, offset, text) => {
    limit = parseInt(limit) || 10
    offset = parseInt(offset) || 0
    offset = offset * limit
    const regex = new RegExp(text, 'i')
    const [funcionarios, length] = await Promise.all(
        [
            FuncionarioModel.find({ $or: [{ nombre: regex }, { dni: regex }, { cargo: regex }] }).skip(offset).limit(limit),
            FuncionarioModel.count({ $or: [{ nombre: regex }, { dni: regex }, { cargo: regex }] })
        ]
    )
    return { funcionarios, length }
}
exports.addMultipleUsers = async (funcionarios) => {
    const all_dni = funcionarios.map(funcionario => funcionario.dni)
    let existeDni = await FuncionarioModel.findOne({ "dni": { "$in": all_dni } })
    if (existeDni) {
        throw ({ status: 400, message: `El Dni:${existeDni.dni} del funcionario ${existeDni.nombre} ya existe` });
    }
    const newFuncionarios = await FuncionarioModel.insertMany(funcionarios)
    return newFuncionarios
}
exports.getOfficerByText = async (text) => {
    const regex = new RegExp(text, 'i')
    return await FuncionarioModel.aggregate([
        {
            $addFields: {
                fullname: {
                    $concat: ["$nombre", " ", { $ifNull: ["$paterno", ""] }, " ", { $ifNull: ["$materno", ""] }]
                }
            },
        },
        {
            $match: {
                activo: true,
                $or: [
                    { fullname: regex },
                    { cargo: regex }
                ]
            }
        },
        { $project: { __v: 0 } },
        { $limit: 5 }
    ]);
}
