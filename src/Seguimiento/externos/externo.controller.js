const { request, response } = require('express')
require('dotenv').config()
const { TramiteExterno, Solicitante, Representante } = require('./externo.model')
const TiposTramites = require('../../Configuraciones/tipos-tramites/tipoTramite.model')
const BandejaSalida = require('../bandejas/bandeja-salida.model')
const BandejaEntrada = require('../bandejas/bandeja-entrada.model')
const { ErrorResponse } = require('../../../helpers/responses')

const add = async (req = request, res = response) => {
    let { tramite, representante, solicitante } = req.body
    tramite.cuenta = req.id_cuenta
    tramite.ubicacion = req.id_cuenta
    tramite.alterno = `${tramite.alterno}-${process.env.CONFIG_YEAR}`
    try {
        if (representante) {
            const newRepresentante = new Representante(representante)
            const representanteDB = await newRepresentante.save()
            tramite.representante = representanteDB._id
        }
        const newSolicitante = new Solicitante(solicitante)
        const solicitanteDB = await newSolicitante.save()
        tramite.solicitante = solicitanteDB._id

        const regex = new RegExp(tramite.alterno, 'i')
        let correlativo = await TramiteExterno.find({ alterno: regex }).count()
        correlativo += 1
        tramite.alterno = `${tramite.alterno}-${addLeadingZeros(correlativo, 6)}`
        tramite.estado = 'INSCRITO'
        tramite.fecha_registro = new Date()
        tramite.pin = Math.floor(100000 + Math.random() * 900000)

        const newTramite = new TramiteExterno(tramite)
        const tramiteDB = await newTramite.save()

        await TramiteExterno.populate(tramiteDB, { path: 'solicitante' })
        await TramiteExterno.populate(tramiteDB, { path: 'representante' })
        await TramiteExterno.populate(tramiteDB, { path: 'tipo_tramite', select: 'nombre -_id' })
        return res.json({
            ok: true,
            tramite: tramiteDB
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}
const get = async (req = request, res = response) => {
    let { offset, limit } = req.query
    offset = offset ? offset : 0
    limit = limit ? limit : 10
    offset = offset * limit
    try {
        const [tramites, total] = await Promise.all([
            await TramiteExterno.find({ cuenta: req.id_cuenta })
                .sort({ _id: -1 })
                .skip(offset)
                .limit(limit)
                .populate('solicitante')
                .populate('representante')
                .populate('tipo_tramite', 'nombre'),
            await TramiteExterno.count({ cuenta: req.id_cuenta })
        ]);
        return res.status(200).json({
            ok: true,
            total,
            tramites
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}
const edit = async (req = request, res = response) => {
    const id_tramite = req.params.id
    let { tramite, solicitante, representante } = req.body
    try {
        const tramitedb = await TramiteExterno.findById(id_tramite)
        if (!tramitedb) {
            return res.status(400).json({
                ok: false,
                message: 'El tramite para la edicion no existe'
            })
        }
        let sendTramite = await BandejaSalida.findOne({ tramite: id_tramite, recibido: true, tipo: 'tramites_externos' })
        if (sendTramite) {
            return res.status(405).json({
                ok: false,
                message: 'El tramite ya ha sido aceptado, por lo que no se puede editar'
            })
        }
        if (representante) {
            switch (tramitedb.representante) {
                case undefined:
                    const newRepresentante = new Representante(representante)
                    const representanteDB = await newRepresentante.save()
                    tramite.representante = representanteDB._id
                    break;
                default:
                    await Representante.findByIdAndUpdate(tramitedb.representante, representante)
                    break;
            }
        }
        await Solicitante.findByIdAndUpdate(tramitedb.solicitante, solicitante)
        const editTramite = await TramiteExterno.findByIdAndUpdate(id_tramite, tramite, { new: true })
            .populate('tipo_tramite', 'nombre -_id')
            .populate('solicitante')
            .populate('representante')
        return res.json({
            ok: true,
            tramite: editTramite
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}
const getOne = async (req = request, res = response) => {
    try {
        const [tramite, workflow] = await Promise.all([
            await TramiteExterno.findById(req.params.id)
                .populate('solicitante', '-_id -__v')
                .populate('representante', '-_id -__v')
                .populate('tipo_tramite', 'nombre -_id'),

            await BandejaSalida.find({ tramite: req.params.id }).select('-_id -__v')
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
        res.json({
            ok: true,
            tramite,
            workflow
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}
const getTypes = async (req = request, res = response) => {
    const segmento = req.params.segmento
    if (!segmento) {
        return res.status(400).json({
            ok: false,
            message: 'Seleccione el segmento de tramite'
        })
    }
    try {
        let tipos = await TiposTramites.find({ segmento, activo: true, tipo: 'EXTERNO' }).select('nombre requerimientos')
        tipos.forEach((element, i) => {
            tipos[i].requerimientos = element.requerimientos.filter(requerimiento => requerimiento.activo === true)
        })
        return res.json({
            ok: true,
            tipos
        })
    } catch (error) {
        ErrorResponse(res, error)
    }
}
const getGroupsTypes = async (req = request, res = response) => {
    try {
        const groups = await TiposTramites.distinct('segmento', { tipo: 'EXTERNO', activo: true })
        return res.json({
            ok: true,
            groups
        })
    } catch (error) {
        ErrorResponse(res, error)
    }
}


const addLeadingZeros = (num, totalLength) => {
    return String(num).padStart(totalLength, '0');
}


// Observaciones
const addObservacion = async (req = request, res = response) => {
    const id_tramite = req.params.id
    const { descripcion, funcionario } = req.body
    try {
        const tramitedb = await TramiteExterno.findById(id_tramite)
        if (tramitedb.ubicacion != req.id_cuenta) {
            return res.status(400).json({
                ok: false,
                message: 'Usted no esta a cargo del tramite para registrar observaciones'
            })
        }
        let found = tramitedb.observaciones.some(element => element.id_cuenta === req.id_cuenta)
        if (found) {
            return res.status(400).json({
                ok: false,
                message: 'Usted ya ha registrado sus observaciones para este tramite'
            })
        }
        let observacion = {
            id_cuenta: req.id_cuenta,
            funcionario,
            descripcion,
            corregido: false,
            fecha: new Date()
        }
        await TramiteExterno.findByIdAndUpdate(id_tramite, {
            $push: {
                observaciones: observacion
            },
            estado: 'OBSERVADO'
        })
        res.json({
            ok: true,
            observacion
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}
const putObservacion = async (req = request, res = response) => {
    const id_tramite = req.params.id
    try {
        const tramitedb = await TramiteExterno.findOneAndUpdate(
            {
                _id: id_tramite,
                observaciones: {
                    $elemMatch: { id_cuenta: req.id_cuenta }
                }
            }, { $set: { "observaciones.$.corregido": true } }, { new: true })

        let corregido = tramitedb.observaciones.some(obs => obs.corregido === false)
        let newEstado = tramitedb.estado
        if (!corregido) {
            await TramiteExterno.findByIdAndUpdate(id_tramite, { estado: 'EN REVISION' })
            newEstado = "EN REVISION"
        }
        res.json({
            ok: true,
            estado: newEstado
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}

const concludedTramite = async (req = request, res = response) => {
    const id_tramite = req.params.id
    const { referencia } = req.body
    try {
        await TramiteExterno.findByIdAndUpdate(id_tramite, { estado: 'CONCLUIDO', fecha_finalizacion: new Date(), detalle_conclusion: referencia })
        await BandejaEntrada.findOneAndDelete({ tramite: id_tramite })
        res.json({
            ok: true,
            message: 'Tramite finalizado'
        })
    } catch (error) {
        console.log('[SERVER]:Error (finalizar tramite) => ', error)
        return res.status(500).json({
            ok: false,
            message: 'Error al finalizar el tramite'
        })
    }
}

const search = async (req = request, res = response) => {
    const text = req.params.text
    let { type, limit, offset } = req.query
    const regex = new RegExp(text, 'i')
    offset = parseInt(offset) || 0;
    limit = parseInt(limit) || 10;
    offset = offset * limit
    try {
        let tramites, total
        if (type === 'alterno') {
            tramites = await TramiteExterno.find({ alterno: regex, cuenta: req.id_cuenta }).skip(offset).limit(limit)
            total = await TramiteExterno.count({ alterno: regex, cuenta: req.id_cuenta })
        }
        else if (type === 'solicitante') {
            // const ids_solicitantes = await Solicitante.aggregate([
            //     {
            //         $addFields: {
            //             fullname: {
            //                 $concat: ["$nombre", " ", { $ifNull: ["$paterno", ""] }, " ", { $ifNull: ["$materno", ""] }]
            //             }
            //         },
            //     },
            //     {
            //         $match: {
            //             $or: [
            //                 { fullname: regex },
            //                 { dni: regex }
            //             ]
            //         }
            //     },
            //     { $project: { _id: 1 } }
            // ]);
            // tramites = await TramiteExterno.find({ cuenta: req.id_cuenta, solicitante: { $in: ids_solicitantes } }).skip(offset).limit(limit)
            // total = await TramiteExterno.count({ cuenta: req.id_cuenta, solicitante: { $in: ids_solicitantes } })

            tramites = await TramiteExterno.aggregate([
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
                // {
                //     $project: {
                //         "funcionario.nombre": 1,
                //         "funcionario.paterno": 1,
                //         "funcionario.materno": 1,
                //         "funcionario.cargo": 1,
                //         "funcionario._id": 1,
                //         _id: 1,
                //         activo: 1,
                //     },
                // },
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
                            { estado: regex },
                        ],
                    },
                },
                {
                    $project: {
                        "solicitante.fullname": 0
                    }
                },
                { $skip: offset },
                { $limit: limit },
            ]);
        }

        await TramiteExterno.populate(tramites, { path: 'tipo_tramite', select: 'nombre -_id' })
        await TramiteExterno.populate(tramites, { path: 'solicitante' })
        await TramiteExterno.populate(tramites, { path: 'representante' })
        return res.json({
            ok: true,
            tramites,
            total
        })
    } catch (error) {
        return ErrorResponse(res, error)
    }
}

const unarchived = async (req = request, res = response) => {
    const id_tramite = req.params.id
    try {
        const ultimo_envio = await BandejaSalida.findOne({ tramite: id_tramite, recibido: true }).sort({ _id: -1 })
        if (ultimo_envio) {
            const mail_entrada = {
                tramite: id_tramite,
                emisor: ultimo_envio.emisor.cuenta,
                receptor: ultimo_envio.receptor.cuenta,
                recibido: true,
                motivo: ultimo_envio.motivo,
                cantidad: ultimo_envio.cantidad,
                fecha_envio: ultimo_envio.fecha_envio,
                tipo: ultimo_envio.tipo
            }
            await BandejaEntrada.create(mail_entrada)
            await TramiteExterno.findByIdAndUpdate(id_tramite, { estado: "EN REVISION" })
        }
        else {
            await TramiteExterno.findByIdAndUpdate(id_tramite, { estado: "INSCRITO" })
        }
        return res.json({
            ok: true,
            message: 'Tramite desarchivado'
        })


    } catch (error) {
        return ErrorResponse(res, error)
    }
}

module.exports = {
    getTypes,
    getGroupsTypes,
    add,
    get,
    edit,
    getOne,
    search,
    addObservacion,
    putObservacion,
    concludedTramite,
    unarchived
}