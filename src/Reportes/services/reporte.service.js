const {ExternoModel} = require('../../Tramites/models/externo.model')
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
        const workflow = await SalidaModel.find({ tramite: tramite._id})
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

}





module.exports = ReporteService