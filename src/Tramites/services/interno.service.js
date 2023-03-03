require('dotenv').config()
const InternoModel = require('../models/interno.model')
const SalidaModel = require('../../Bandejas/models/salida.model')

class InternoService {
    async get(id_cuenta, limit, offset) {
        offset = offset ? offset : 0
        limit = limit ? limit : 10
        offset = offset * limit
        const [tramites, total] = await Promise.all([
            InternoModel.find({ cuenta: id_cuenta }).sort({ _id: -1 })
                .skip(offset)
                .limit(limit)
                .populate('tipo_tramite', '-_id nombre'),
            InternoModel.count({ cuenta: id_cuenta })
        ])
        return { tramites, total }
    }

    async getOne(id_tramite) {
        const [tramite, workflow] = await Promise.all([
            await InternoModel.findOne({ _id: id_tramite })
                .populate('tipo_tramite', '-_id nombre')
                .populate({
                    path: 'ubicacion',
                    select: '_id',
                    populate: [
                        {
                            path: 'funcionario',
                            select: 'nombre paterno materno cargo -_id'
                        },
                        {
                            path: 'dependencia',
                            select: 'nombre -_id',
                            populate: {
                                path: 'institucion',
                                select: 'sigla -_id'
                            }
                        }
                    ]
                }),
            await SalidaModel.find({ tramite: id_tramite }).select('-_id -__v')
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
        ])
        return {tramite, workflow}
    }
}
module.exports = InternoService