require('dotenv').config()
const InternoModel = require('../models/interno.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const UsersModel = require('../../Configuraciones/models/funcionarios.model')

exports.get = async (id_cuenta, limit, offset) => {
    offset = offset ? offset : 0
    limit = limit ? limit : 10
    offset = offset * limit
    const [tramites, length] = await Promise.all([
        InternoModel.find({ cuenta: id_cuenta }).sort({ _id: -1 })
            .skip(offset)
            .limit(limit)
            .populate('tipo_tramite', '-_id nombre'),
        InternoModel.count({ cuenta: id_cuenta })
    ])
    return { tramites, length }

}
exports.getOne = async (id_procedure) => {
    const [tramite, location, workflow] = await Promise.all([
        getProcedure(id_procedure),
        getLocation(id_procedure),
        getWorkflow(id_procedure)
    ])
    return { tramite, workflow, location }
}

exports.add = async (tramite, id_cuenta) => {
    tramite.cuenta = id_cuenta
    tramite.alterno = `${tramite.alterno}-${process.env.CONFIG_YEAR}`
    const regex = new RegExp(tramite.alterno, 'i')
    let correlativo = await InternoModel.find({ alterno: regex }).count()
    correlativo += 1
    tramite.alterno = `${tramite.alterno}-${addLeadingZeros(correlativo, 5)}`

    const newTramite = new InternoModel(tramite)
    const tramiteDB = await newTramite.save()
    await InternoModel.populate(tramiteDB, { path: 'tipo_tramite', select: '-_id nombre' })
    return tramiteDB

}
exports.edit = async (id_tramite, tramite) => {
    let sendTramite = await SalidaModel.findOne({ tramite: id_tramite, recibido: true, tipo: 'tramites_internos' })
    if (sendTramite) {
        throw ({ status: 405, message: 'El tramite ya ha sido aceptado, por lo que no se puede editar' });
    }
    const tramiteDB = await InternoModel.findByIdAndUpdate(id_tramite, tramite, { new: true })
        .populate('tipo_tramite', '-_id nombre')

    return tramiteDB

}
exports.search = async (id_cuenta, limit, offset, text) => {
    offset = offset ? offset : 0
    limit = limit ? limit : 10
    offset = offset * limit
    const regex = new RegExp(text, 'i')
    const [tramites, length] = await Promise.all([
        InternoModel.find({ cuenta: id_cuenta, $or: [{ alterno: regex }, { detalle: regex }, { cite: regex }] })
            .skip(offset)
            .limit(limit)
            .populate('tipo_tramite', '-_id nombre'),
        InternoModel.count({ cuenta: id_cuenta, $or: [{ alterno: regex }, { detalle: regex }, { cite: regex }] })
    ])
    return { tramites, length }
}

exports.getUsers = async (text) => {
    const regex = new RegExp(text, 'i')
    const usuarios = await UsersModel.find({ $or: [{ nombre: regex }, { paterno: regex }, { materno: regex }] }).select('-_id nombre paterno materno cargo').limit(5)
    return usuarios
}

const getProcedure = async (id_procedure) => {
    const procedure = await InternoModel.findOne({ _id: id_procedure })
        .populate('tipo_tramite', '-_id nombre')
        .populate({
            path: 'cuenta',
            select: '_id',
            populate: {
                path: 'funcionario',
                select: 'nombre paterno materno cargo -_id'
            }
        })
    if (!procedure) throw ({ status: 404, message: 'El tramite no existe' });
    return procedure
}
const getWorkflow = async (id_procedure) => {
    return await SalidaModel.find({ tramite: id_procedure }).select('-_id -__v')
        .populate({
            path: 'emisor.cuenta',
            select: '_id',
            populate: {
                path: 'dependencia',
                select: 'nombre',
                populate: {
                    path: 'institucion',
                    select: 'sigla'
                }
            }
        })
        .populate({
            path: 'emisor.funcionario',
            select: '-_id nombre paterno materno cargo',
        })
        .populate({
            path: 'receptor.cuenta',
            select: '_id',
            populate: {
                path: 'dependencia',
                select: 'nombre',
                populate: {
                    path: 'institucion',
                    select: 'sigla'
                }
            }
        })
        .populate({
            path: 'receptor.funcionario',
            select: '-_id nombre paterno materno cargo',
        })
}
const getLocation = async (id_procedure) => {
    let location = await SalidaModel.find({ tramite: id_procedure })
        .select('receptor.cuenta -_id')
        .populate({
            path: 'receptor.cuenta',
            select: 'dependencia funcionario -_id',
            populate: [
                {
                    path: 'funcionario',
                    select: 'nombre paterno materno cargo -_id'
                },
                {
                    path: 'dependencia',
                    select: 'nombre -_id'
                }
            ]
        })
    if (location.length === 0) {
        location = await InternoModel.findById(id_procedure)
            .select('cuenta -_id').populate({
                path: 'cuenta',
                select: 'funcionario dependencia -_id',
                populate: [
                    {
                        path: 'funcionario',
                        select: 'nombre paterno materno cargo -_id'
                    },
                    {
                        path: 'dependencia',
                        select: 'nombre -_id'
                    }
                ]
            })
        return [location]
    }
    location = location.map(element => element.receptor)
    return location
}
const addLeadingZeros = (num, totalLength) => {
    return String(num).padStart(totalLength, '0');
}
