const { ExternoModel } = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const InstitucionesModel = require('../../Configuraciones/instituciones/instituciones.model')

class ReporteService {
    async reporteFicha(alterno) {
        let tipo = 'tramites_externos'
        let tramite = await ExternoModel.findOne({ alterno: alterno })

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
            tipo = 'tramites_internos'
            tramite = await InternoModel.findOne({ alterno: alterno })
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
                throw ({ status: 405, message: `No se encontro ningun tramite Externo o Interno con el alterno: ${alterno}` });
            }
        }
        const workflow = await SalidaModel.find({ tramite: tramite._id })
            // .select('fecha_envio fecha_recibido fecha_envio')
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
            workflow,
            tipo
        }
    }
    async reporteBusqueda(params, type) {
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
        // else {
        //     if (start) {
        //         Object.assign(query, {
        //             fecha_registro: {
        //                 $gte: start
        //             }
        //         })
        //     }
        //     else {
        //         Object.assign(query, {
        //             fecha_registro: {
        //                 $lt: end
        //             }
        //         })
        //     }
        // }
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
    async estadisticoInstitucion() {
        let instituciones = await InstitucionesModel.find({ activo: true }).select('nombre sigla -_id')
        if (!instituciones) {
            throw ({ status: 400, message: `No existen instituciones registradas` });
        }
        let data = []
        for (const institucion of instituciones) {
            const cantidad_externos = await ExternoModel.count({ alterno: { $regex: institucion.sigla } })
            const cantidad_internos = await InternoModel.count({ alterno: { $regex: institucion.sigla } })
            data.push({ name: institucion.nombre, cantidad_externos, cantidad_internos })
        }
        return data
    }
    async reporteSolicitante(parametros) {
        // convert object in array of objects for key
        parametros = Object
            .keys(parametros)
            .map(k => ({ [`solicitante.${k}`]: new RegExp(parametros[k], 'i') }));

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
            throw ({ status: 404, message: `El solicitante con los parametros ingresados no existe` });
        }
        return tramites
    }
    async reporteRepresentante(parametros) {
        // convert object in array of objects for key
        parametros = Object
            .keys(parametros)
            .map(k => ({ [`representante.${k}`]: new RegExp(parametros[k], 'i') }));

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

}





module.exports = ReporteService