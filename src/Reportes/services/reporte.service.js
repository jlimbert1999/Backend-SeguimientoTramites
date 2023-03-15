const { ExternoModel } = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
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

    async reporteBusqueda(params) {

        console.log(new Date(params.start))

        let query = {}
        let { alterno, cite, start, end, ...info } = params

        alterno = alterno ? new RegExp(alterno, 'i') : undefined
        cite = cite ? new RegExp(cite, 'i') : undefined

        Object.assign(query, alterno ? { alterno } : '', cite ? { cite } : '', info)


        let result = Object
            .keys(query)
            .map(k => ({ [k]: query[k] }));

      
        // if (start && end) {
        //     tramites = await ExternoModel.find({ $and: result, fecha_registro:  })
        // }
        // else {

        // }

        // async get(id_cuenta, limit, offset) {
        //     offset = offset ? offset : 0
        //     limit = limit ? limit : 10
        //     offset = offset * limit
        //     const [tramites, total] = await Promise.all([
        //         await ExternoModel.find({ cuenta: id_cuenta })
        //             .sort({ _id: -1 })
        //             .skip(offset)
        //             .limit(limit)
        //             .populate('solicitante')
        //             .populate('representante')
        //             .populate('tipo_tramite', 'nombre'),
        //         await ExternoModel.count({ cuenta: id_cuenta })
        //     ]);
        //     return { tramites, total }
        // }
        const tramites = await ExternoModel.find({ $and: result })

        return tramites

    }


}





module.exports = ReporteService