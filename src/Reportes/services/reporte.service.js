const ExternoModel = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const ObjectId = require('mongoose').Types.ObjectId

exports.getReportPetitioner = async (params) => {
    const { start, end, ...info } = params
    let fecha_registro = {}
    let query = Object.keys(info).map(k => {
        if (k == 'dni') return ({ [`solicitante.${k}`]: info[k] })
        else return ({ [`solicitante.${k}`]: new RegExp(info[k], 'i') })
    }
    );
    start ? Object.assign(fecha_registro, { $gte: new Date(start) }) : null;
    end ? Object.assign(fecha_registro, { $lt: new Date(end) }) : null;
    Object.keys(fecha_registro).length > 0 ? query.push({ fecha_registro }) : null
    const tramites = await ExternoModel.find({ $and: query });
    return tramites
}

exports.getReportFicha = async (group, params) => {
    let { start, end, estado, ...info } = params
    let query = Object.keys(info).map(k => ({ [k]: new RegExp(info[k], 'i') }))
    let fecha_registro = {}
    start ? Object.assign(fecha_registro, { $gte: new Date(start) }) : null
    end ? Object.assign(fecha_registro, { $lt: new Date(end) }) : null
    Object.keys(fecha_registro).length > 0 ? query.push({ fecha_registro }) : null
    return tramites = group === 'tramites_externos'
        ? await ExternoModel.find({ $or: query })
        : await InternoModel.find({ $or: query })
}
exports.getReportByAccount = async (group, params) => {
    const { start, end, estado, cuenta } = params
    let query = { cuenta: cuenta }
    let fecha_registro = {}
    start ? Object.assign(fecha_registro, { $gte: new Date(start) }) : null
    end ? Object.assign(fecha_registro, { $lt: new Date(end) }) : null
    Object.keys(fecha_registro).length > 0 ? query['fecha_registro'] = fecha_registro : null
    estado ? query['estado'] = estado : null
    return tramites = group === 'tramites_externos'
        ? await ExternoModel.find(query)
        : await InternoModel.find(query)
}
exports.getReportByTypeProcedure = async (group, params) => {
    const { start, end, estado, tipo_tramite } = params
    let query = { tipo_tramite }
    let fecha_registro = {}
    start ? Object.assign(fecha_registro, { $gte: new Date(start) }) : null
    end ? Object.assign(fecha_registro, { $lt: new Date(end) }) : null
    Object.keys(fecha_registro).length > 0 ? query['fecha_registro'] = fecha_registro : null
    estado ? query['estado'] = estado : null
    return tramites = group === 'tramites_externos'
        ? await ExternoModel.find(query)
        : await InternoModel.find(query)
}
exports.getReportByUnit = async (group, params) => {
    const { estado, start, end, ...info } = params
    let query = Object.keys(info).map(k => {
        if (k === 'institucion') return ({ 'receptor.cuenta.dependencia.institucion': ObjectId(info[k]) })
        else if (k === 'dependencia') return ({ 'receptor.cuenta.dependencia._id': ObjectId(info[k]) })
        else if (k === 'cuenta') return ({ 'receptor.cuenta._id': ObjectId(info[k]) })
        else if (k === 'tipo_tramite') return ({ 'tramite.tipo_tamite': ObjectId(info[k]) })
        return ({ [k]: info[k] })
    })
    let fecha_envio = {}
    start ? Object.assign(fecha_envio, { $gte: new Date(start) }) : null
    end ? Object.assign(fecha_envio, { $lt: new Date(end) }) : null
    Object.keys(fecha_envio).length > 0 ? query.push({ fecha_envio }) : null
    estado ? query.push({ 'tramite.estado': estado }) : null
    const procedures = await SalidaModel.aggregate([
        {
            $project: {
                'receptor.cuenta': 1,
                tramite: 1,
            }
        },
        {
            $lookup: {
                from: "cuentas",
                localField: "receptor.cuenta",
                foreignField: "_id",
                as: "receptor.cuenta",
            },
        },
        {
            $unwind: {
                path: "$receptor.cuenta",
            },
        },
        {
            $lookup: {
                from: "dependencias",
                localField: "receptor.cuenta.dependencia",
                foreignField: "_id",
                as: "receptor.cuenta.dependencia",
            },
        },
        {
            $unwind: {
                path: "$receptor.cuenta.dependencia",
            },
        },
        {
            $project: {
                'receptor.cuenta.password': 0,
                'receptor.cuenta.login': 0,
                'receptor.cuenta.activo': 0,
                'receptor.cuenta.rol': 0,
                'receptor.cuenta.__v': 0,
                'receptor.cuenta.dependencia.sigla': 0,
                'receptor.cuenta.dependencia.__v': 0,
                'receptor.cuenta.dependencia.codigo': 0,
                'receptor.cuenta.dependencia.activo': 0,
                'receptor.cuenta.dependencia.nombre': 0,
                'receptor.cuenta.funcionario': 0,
            }
        },
        {
            $lookup: {
                from: `${group}`,
                localField: "tramite",
                foreignField: "_id",
                as: "tramite",
            },
        },
        {
            $unwind: {
                path: "$tramite",
            },
        },
        {
            $project: {
                'tramite.observaciones': 0,
                'tramite.eventos': 0,
                'tramite.requerimientos': 0
            }
        },
        {
            $match: {
                $and: query
            }
        },
        {
            $group: {
                _id: "$tramite"
            }
        },
        {
            $project: {
                'tramite': "$_id",
                _id: false
            }
        },
    ])
    return procedures
}


exports.getReportSearch = async (group, params) => {
    let { limit, offset, start, end, estado, tipo_tramite, ...info } = params
    let query = Object.keys(info).map(k => {
        switch (k) {
            case 'solicitante':
                return ({
                    $or: [
                        { 'tramite.solicitante.nombre': new RegExp(info[k], 'i') },
                        { 'tramite.solicitante.paterno': new RegExp(info[k], 'i') },
                        { 'tramite.solicitante.materno': new RegExp(info[k], 'i') },
                        { 'tramite.solicitante.dni': new RegExp(info[k], 'i') }
                    ]
                })
                break;
            case 'representante':
                return ({
                    $or: [
                        { 'tramite.representante.nombre': new RegExp(info[k], 'i') },
                        { 'tramite.representante.paterno': new RegExp(info[k], 'i') },
                        { 'tramite.representante.materno': new RegExp(info[k], 'i') },
                        { 'tramite.representante.dni': new RegExp(info[k], 'i') }
                    ]
                })
                break;
            case 'remitente':
                return ({
                    $or: [
                        { 'tramite.remitente.nombre': new RegExp(info[k], 'i') },
                        { 'tramite.remitente.cargo': new RegExp(info[k], 'i') },
                    ]
                })
                break;
            case 'destinatario':
                return ({
                    $or: [
                        { 'tramite.destinatario.nombre': new RegExp(info[k], 'i') },
                        { 'tramite.destinatario.cargo': new RegExp(info[k], 'i') },
                    ]
                })
                break;

            default:
                return ({ [k]: new RegExp(info[k], 'i') })
                break;
        }
    });
    let fecha_registro = {}
    start ? Object.assign(fecha_registro, { $gte: new Date(start) }) : null
    end ? Object.assign(fecha_registro, { $lt: new Date(end) }) : null
    Object.keys(fecha_registro).length > 0 ? query.push({ fecha_registro }) : null
    estado ? query.push({ 'estado': estado }) : null
    limit = limit ? parseInt(limit) : 10;
    offset = offset ? parseInt(offset) : 0;
    offset = offset * limit
    console.log(query);
    const [procedures, length] = group === 'tramites_externos'
        ? await Promise.all([
            ExternoModel.find({ $and: query }).skip(offset).limit(limit),
            ExternoModel.count({ $and: query })
        ])
        : await Promise.all([
            InternoModel.find({ $and: query }).skip(offset).limit(limit),
            InternoModel.count({ $and: query })
        ])
    return { procedures, length }
}


