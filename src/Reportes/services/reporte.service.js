const { ExternoModel } = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const { default: mongoose } = require("mongoose");

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
        let { limit, offset, alterno, cite, start, end, ...info } = params
        info = Object
            .keys(info)
            .map(k => ({ [k]: info[k] }));

        alterno = alterno ? info.push({ alterno: new RegExp(alterno, 'i') }) : undefined
        cite = cite ? info.push({ cite: new RegExp(cite, 'i') }) : undefined
        // tipo_tramite = tipo_tramite ? info.push({ tipo_tramite: mongoose.Types.ObjectId(tipo_tramite) }) : undefined

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
        // offset = parseInt(offset) || 0;
        // limit = parseInt(limit) || 10;
        offset = offset * limit
        console.log(query)
        console.log('limit', limit)
        console.log('offset', offset)
        if (type === 'EXTERNO') {
            [tramites, length] = await Promise.all([
                ExternoModel.find(query).populate('solicitante'),
                ExternoModel.countDocuments(query)
            ])

        }
        else {
            [tramites, length] = await Promise.all([
                InternoModel.find(query).skip(offset).limit(limit),
                InternoModel.countDocuments(query)
            ])
        }
        console.log(tramites.length)
        console.log(length)
        return { tramites, length }

    }


}





module.exports = ReporteService