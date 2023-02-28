require('dotenv').config()
const { ServerErrorResponde, BadRequestResponse, ExceptionResponse } = require('../../../helpers/responses')
const { ExternoModel, SolicitanteModel, RepresentanteModel } = require('../models/externo.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const TiposModel = require('../../Configuraciones/tipos-tramites/tipoTramite.model')

class ExternoService {
    async get(id_cuenta, limit, offset) {
        offset = offset ? offset : 0
        limit = limit ? limit : 10
        offset = offset * limit
        const [tramites, total] = await Promise.all([
            await ExternoModel.find({ cuenta: id_cuenta })
                .sort({ _id: -1 })
                .skip(offset)
                .limit(limit)
                .populate('solicitante')
                .populate('representante')
                .populate('tipo_tramite', 'nombre'),
            await ExternoModel.count({ cuenta: id_cuenta })
        ]);
        return { tramites, total }
    }

    async getOne(id_tramite) {
        const [tramite, workflow] = await Promise.all([
            await ExternoModel.findById(id_tramite)
                .populate('solicitante', '-_id -__v')
                .populate('representante', '-_id -__v')
                .populate('tipo_tramite', 'nombre -_id'),

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
        ])
        return { tramite, workflow }
    }

    async search(text, limit, offset) {
        const regex = new RegExp(text, 'i')
        offset = parseInt(offset) || 0;
        limit = parseInt(limit) || 10;
        offset = offset * limit
        const data = await ExternoModel.aggregate([
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
                $addFields: {
                    "solicitante.fullname": {
                        $concat: [
                            "$solicitante.nombre",
                            " ",
                            { $ifNull: ["$solicitante.paterno", ""] },
                            " ",
                            { $ifNull: ["$solicitante.materno", ""] },
                        ],
                    },
                },
            },
            {
                $match: {
                    $or: [
                        { "solicitante.fullname": regex },
                        { alterno: regex },
                        { detalle: regex },
                        { cite: regex },
                    ],
                },
            },
            {
                $project: {
                    "solicitante.fullname": 0
                }
            },
            {
                $facet: {
                    paginatedResults: [{ $skip: offset }, { $limit: limit }],
                    totalCount: [
                        {
                            $count: 'count'
                        }
                    ]
                }
            }
        ]);
        await ExternoModel.populate(data[0].paginatedResults.length, [
            { path: 'tipo_tramite', select: 'nombre -_id' },
            { path: 'solicitante' },
            { path: 'representante' }
        ])
        let tramites = data[0].paginatedResults
        const total = data[0].totalCount[0] ? data[0].totalCount[0].count : 0
        return { tramites, total }

    }

    async getTypes(segmento) {
        if (!segmento) {
            throw ({ status: 400, message: 'Seleccione el segmento de tramite' });
        }
        let tipos = await TiposModel.find({ segmento, activo: true, tipo: 'EXTERNO' }).select('nombre requerimientos')
        tipos.forEach((element, i) => {
            tipos[i].requerimientos = element.requerimientos.filter(requerimiento => requerimiento.activo === true)
        })
        return tipos
    }

    async getGroupsTypes() {
        try {
            const groups = await TiposModel.distinct('segmento', { tipo: 'EXTERNO', activo: true })
            return groups
        } catch (error) {
            throw ServerErrorResponde('Ha ocurrido un error en el servidor', error)
        }
    }

    async add(id_cuenta, tramite, solicitante, representante) {
        tramite.cuenta = id_cuenta
        tramite.ubicacion = id_cuenta
        tramite.alterno = `${tramite.alterno}-${process.env.CONFIG_YEAR}`
        if (representante) {
            const newRepresentante = new RepresentanteModel(representante)
            const representanteDB = await newRepresentante.save()
            tramite.representante = representanteDB._id
        }
        const newSolicitante = new SolicitanteModel(solicitante)
        const solicitanteDB = await newSolicitante.save()
        tramite.solicitante = solicitanteDB._id

        const regex = new RegExp(tramite.alterno, 'i')
        let correlativo = await ExternoModel.find({ alterno: regex }).count()
        correlativo += 1
        tramite.alterno = `${tramite.alterno}-${this.addLeadingZeros(correlativo, 6)}`
        tramite.estado = 'INSCRITO'
        tramite.pin = Math.floor(100000 + Math.random() * 900000)

        const newTramite = new ExternoModel(tramite)
        const tramiteDB = await newTramite.save()

        await ExternoModel.populate(tramiteDB, [
            { path: 'solicitante' },
            { path: 'representante' },
            { path: 'tipo_tramite', select: 'nombre -_id' }
        ])
        return tramiteDB
    }

    async edit(id_tramite, tramite, solicitante, representante) {
        const tramitedb = await ExternoModel.findById(id_tramite)
        if (!tramitedb) {
            throw ({ status: 400, message: 'El tramite no existe' });
        }
        let sendTramite = await SalidaModel.findOne({ tramite: id_tramite, recibido: true, tipo: 'tramites_externos' })
        if (sendTramite) {
            throw ({ status: 405, message: 'El tramite ya ha sido aceptado, por lo que no se puede editar' });
        }
        if (representante) {
            switch (tramitedb.representante) {
                case undefined:
                    const newRepresentante = new RepresentanteModel(representante)
                    const representanteDB = await newRepresentante.save()
                    tramite.representante = representanteDB._id
                    break;
                default:
                    await RepresentanteModel.findByIdAndUpdate(tramitedb.representante, representante)
                    break;
            }
        }
        await SolicitanteModel.findByIdAndUpdate(tramitedb.solicitante, solicitante)
        const editTramite = await ExternoModel.findByIdAndUpdate(id_tramite, tramite, { new: true })
            .populate('tipo_tramite', 'nombre -_id')
            .populate('solicitante')
            .populate('representante')
        return editTramite
    }

    // async conclude(id_tramite, tramite, solicitante, representante) {
    //     const id_tramite = req.params.id
    //     const { referencia } = req.body
    //     await BandejaEntrada.findOneAndDelete({ tramite: id_tramite, 'receptor.cuenta': req.id_cuenta })
    //     let processActive = await BandejaEntrada.findOne({ tramite: id_tramite })
    //     if (!processActive) {
    //         await TramiteExterno.findByIdAndUpdate(id_tramite, { estado: 'CONCLUIDO', fecha_finalizacion: new Date(), detalle_conclusion: referencia, $push: { eventos: { funcionario: req.id_funcionario, descripcion: referencia } } })
    //     }
    //     else {
    //         await TramiteExterno.findByIdAndUpdate(id_tramite, { fecha_finalizacion: new Date(), $push: { eventos: { funcionario: req.id_funcionario, descripcion: referencia } } })
    //     }

    //     res.json({
    //         ok: true,
    //         message: 'Tramite finalizado'
    //     })
    // }



    addLeadingZeros(num, totalLength) {
        return String(num).padStart(totalLength, '0');
    }

}





module.exports = ExternoService