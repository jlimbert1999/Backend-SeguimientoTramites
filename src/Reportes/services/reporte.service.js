const { ExternoModel } = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const InstitucionesModel = require('../../Configuraciones/instituciones/instituciones.model')

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

exports.getReportFicha = async (alterno, group) => {
    let tramites = []
    if (group === 'externo') {
        tramites = await ExternoModel.find({ alterno: RegExp(alterno) })
    }
    else if (group === 'interno') {
        tramites = await InternoModel.find({ alterno: RegExp(alterno) })
    }
    return tramites

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
exports.reportSolicitante = async (parametros) => {
    parametros = Object.keys(parametros).map(k => {
        if (k == 'dni') return ({ [`solicitante.${k}`]: parametros[k] })
        else return ({ [`solicitante.${k}`]: new RegExp(parametros[k], 'i') })
    }
    );
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
                $and: parametros
            },
        },
    ]);
    if (tramites.length === 0) {
        throw ({ status: 400, message: `No existen tramites con los parametros del solicitante ingresados` });
    }
    return tramites
}
exports.reportRepresentante = async (parametros) => {
    // convert object in array of objects for key
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