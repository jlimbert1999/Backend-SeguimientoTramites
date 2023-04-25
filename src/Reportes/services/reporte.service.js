const ExternoModel = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const SalidaModel = require('../../Bandejas/models/salida.model')

const TypesModel = require('../../Configuraciones/models/tipos.model')


const ObjectId = require('mongoose').Types.ObjectId

exports.getAllDataOfTramiteExterno = async (id_tramite) => {
    const tramite = await ExternoModel.findById(id_tramite)
        .populate('solicitante')
        .populate('representante')
        .populate('tipo_tramite', 'nombre -_id')
        .populate({
            path: 'ubicacion',
            select: '_id',
            populate: [
                {
                    path: 'dependencia',
                    select: 'nombre -_id',
                    populate: {
                        path: 'institucion',
                        select: 'sigla'
                    }
                },
                {
                    path: 'funcionario',
                    select: 'nombre paterno materno cargo'
                }
            ]
        })
    if (!tramite) {
        throw ({ status: 400, message: 'El tramite no existe' });
    }
    const workflow = await SalidaModel.find({ tramite: tramite._id })
        .populate({
            path: 'emisor.cuenta',
            select: '_id',
            populate: {
                path: 'dependencia',
                select: 'nombre -_id',
                populate: {
                    path: 'institucion',
                    select: 'sigla -_id'
                }
            }
        })
        .populate({
            path: 'emisor.funcionario',
            select: 'nombre paterno materno cargo'
        })
        .populate({
            path: 'receptor.cuenta',
            select: '_id',
            populate: {
                path: 'dependencia',
                select: 'nombre -_id',
                populate: {
                    path: 'institucion',
                    select: 'sigla -_id'
                }

            }
        })
        .populate({
            path: 'receptor.funcionario',
            select: 'nombre paterno materno cargo'
        })
    return {
        tramite,
        workflow
    }
}
exports.getAllDataOfTramiteInterno = async (id_tramite) => {
    tramite = await InternoModel.findById(id_tramite)
        .select('estado alterno detalle cantidad fecha_registro cite remitente destinatario')
        .populate('tipo_tramite', 'nombre -_id')
        .populate({
            path: 'ubicacion',
            select: '_id',
            populate: [
                {
                    path: 'dependencia',
                    select: 'nombre -_id',
                    populate: {
                        path: 'institucion',
                        select: 'sigla'
                    }
                },
                {
                    path: 'funcionario',
                    select: 'nombre cargo'
                }
            ]
        })
    if (!tramite) {
        throw ({ status: 400, message: 'El tramite no existe' });
    }
    const workflow = await SalidaModel.find({ tramite: tramite._id })
        .populate({
            path: 'emisor.cuenta',
            select: '_id',
            populate: {
                path: 'dependencia',
                select: 'nombre -_id',
                populate: {
                    path: 'institucion',
                    select: 'sigla -_id'
                }
            }
        })
        .populate({
            path: 'emisor.funcionario',
            select: 'nombre paterno materno cargo'
        })
        .populate({
            path: 'receptor.cuenta',
            select: '_id',
            populate: {
                path: 'dependencia',
                select: 'nombre -_id',
                populate: {
                    path: 'institucion',
                    select: 'sigla -_id'
                }

            }
        })
        .populate({
            path: 'receptor.funcionario',
            select: 'nombre paterno materno cargo'
        })
    return {
        tramite,
        workflow
    }
}
exports.reportSolicitante = async (params, dateInit, dateEnd) => {
    let fecha_registro = {}
    let query = Object.keys(params).map(k => {
        if (k == 'dni') return ({ [`solicitante.${k}`]: params[k] })
        else return ({ [`solicitante.${k}`]: new RegExp(params[k], 'i') })
    }
    );
    dateInit ? Object.assign(fecha_registro, { $gte: new Date(dateInit) }) : null;
    dateEnd ? Object.assign(fecha_registro, { $lt: new Date(dateEnd) }) : null;
    Object.keys(fecha_registro).length > 0 ? query.push({ fecha_registro }) : null
    const tramites = await ExternoModel.aggregate([
        {
            $lookup: {
                from: "solicitantes",
                localField: "solicitante",
                foreignField: "_id",
                as: "solicitante",
            },
        },
        {
            $unwind: {
                path: "$solicitante",
            },
        },
        {
            $match: {
                $and: query
            },
        },
    ]);

    if (tramites.length === 0) {
        throw ({ status: 400, message: `No existen tramites con los parametros del solicitante ingresados` });
    }
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
    const { start, end, estado, id_cuenta } = params
    let query = { cuenta: id_cuenta }
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


exports.getReportSearch = async (params, type) => {
    let { limit, offset, alterno, cite, detalle, start, end, ...info } = params
    info = Object
        .keys(info)
        .map(k => ({ [k]: info[k] }));

    alterno = alterno ? info.push({ alterno: new RegExp(alterno, 'i') }) : undefined
    cite = cite ? info.push({ cite: new RegExp(cite, 'i') }) : undefined
    detalle = detalle ? info.push({ detalle: new RegExp(detalle, 'i') }) : undefined

    let query = {}
    info.length > 0 ? Object.assign(query, { $and: info }) : ''

    if (start && end) {
        start = new Date(start)
        end = new Date(end)
        Object.assign(query, {
            fecha_registro: {
                $gte: start,
                $lt: end
            }
        })
    }
    let tramites = [], length = 0
    limit = limit ? parseInt(limit) : 10;
    offset = offset ? parseInt(offset) : 0;
    offset = offset * limit
    if (type === 'EXTERNO') {
        [tramites, length] = await Promise.all([
            ExternoModel.find(query).populate('solicitante').skip(offset).limit(limit),
            ExternoModel.count(query)
        ])
    }
    else {
        [tramites, length] = await Promise.all([
            InternoModel.find(query).skip(offset).limit(limit),
            InternoModel.count(query)
        ])
    }
    return { tramites, length }
}


exports.reportRepresentante = async (parametros) => {

    parametros = Object
        .keys(parametros)
        .map(k => {
            if (k == 'dni') return ({ [`representante.${k}`]: parametros[k] })
            else return ({ [`representante.${k}`]: new RegExp(parametros[k], 'i') })
        });
    console.log(parametros)
    const tramites = await ExternoModel.aggregate([
        {
            $lookup: {
                from: "representantes",
                localField: "representante",
                foreignField: "_id",
                as: "representante",
            },
        },
        {
            $unwind: {
                path: "$representante",
            },
        },
        {
            $match: {
                $and: parametros
            },
        },
    ]);
    if (tramites.length === 0) {
        throw ({ status: 404, message: `El representante con los parametros ingresados no existe` });
    }
    return tramites
}
