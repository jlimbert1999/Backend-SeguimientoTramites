require('dotenv').config()
const { ExternoModel, SolicitanteModel, RepresentanteModel } = require('../models/externo.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const TiposModel = require('../../Configuraciones/models/tipos.model')
const { default: mongoose } = require('mongoose')
const archivoService = require('../../Archivos/services/archivo.service')
const EntradaModel = require('../../Bandejas/models/entrada.model')


exports.getTypesProcedures = async () => {
    let types = await TiposModel.find({ activo: true, tipo: 'EXTERNO' }).select('nombre segmento requerimientos')
    types.forEach((element, i) => {
        types[i].requerimientos = element.requerimientos.filter(requerimiento => requerimiento.activo === true)
    })
    return types
}

exports.get = async (id_cuenta, limit, offset) => {
    offset = parseInt(offset) ? offset : 0
    limit = parseInt(limit) ? limit : 10
    offset = offset * limit
    const [tramites, total] = await Promise.all([
        await ExternoModel.find({ cuenta: id_cuenta, estado: { $ne: 'ANULADO' } })
            .sort({ _id: -1 })
            .skip(offset)
            .limit(limit)
            .populate('solicitante')
            .populate('representante')
            .populate('tipo_tramite', 'nombre'),
        await ExternoModel.count({ cuenta: id_cuenta, estado: { $ne: 'ANULADO' } })
    ]);
    return { tramites, total }
}
exports.getOne = async (id_tramite) => {
    const [tramite, location, workflow] = await Promise.all([
        getProcedure(id_tramite),
        getLocation(id_tramite),
        getWorkflow(id_tramite)
    ])
    return { tramite, workflow, location }
}
exports.search = async (text, limit, offset, id_cuenta) => {
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
                cuenta: mongoose.Types.ObjectId(id_cuenta),
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

    await ExternoModel.populate(data[0].paginatedResults, [
        { path: 'tipo_tramite', select: 'nombre -_id' },
        { path: 'representante' }
    ])
    let tramites = data[0].paginatedResults
    const total = data[0].totalCount[0] ? data[0].totalCount[0].count : 0
    return { tramites, total }
}



exports.add = async (id_cuenta, tramite, solicitante, representante) => {
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
    tramite.alterno = `${tramite.alterno}-${addLeadingZeros(correlativo, 6)}`
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

exports.edit = async (id_tramite, updateData) => {
    let { tramite, solicitante, representante } = updateData
    const tramitedb = await getProcedure(id_tramite)
    const isSend = await SalidaModel.findOne({ tramite: id_tramite, recibido: true, tipo: 'tramites_externos' })
    if (isSend) throw ({ status: 400, message: 'El tramite ya ha sido aceptado para la evaluacion' });
    if (representante) {
        if (tramitedb.representante) {
            const newRepresentante = new RepresentanteModel(representante)
            const representanteDB = await newRepresentante.save()
            tramite.representante = representanteDB._id
        }
        else {
            await RepresentanteModel.findByIdAndUpdate(tramitedb.representante, representante)
        }
    }
    await SolicitanteModel.findByIdAndUpdate(tramitedb.solicitante, solicitante)
    const newTramite = await ExternoModel.findByIdAndUpdate(id_tramite, tramite, { new: true })
        .populate('tipo_tramite', 'nombre -_id')
        .populate('solicitante')
        .populate('representante')

    return newTramite

}

exports.addObservacion = async (id_tramite, descripcion, funcionario, id_cuenta) => {
    const tramitedb = await ExternoModel.findById(id_tramite)
    if (!tramitedb) {
        throw ({ status: 400, message: 'El tramite para observar no existe' });
    }
    if (tramitedb.estado === 'CONCLUIDO') {
        throw ({ status: 400, message: 'El tramite ya ha sido concluido' });
    }
    let observacion = {
        id_cuenta,
        funcionario,
        descripcion
    }
    const data = await ExternoModel.findByIdAndUpdate(id_tramite, {
        $push: {
            observaciones: observacion
        },
        estado: 'OBSERVADO'
    }, { new: true }).select('observaciones estado -_id')
    return data
}
exports.concludeProcedure = async (id_tramite, descripcion, id_funcionario, id_dependencia) => {
    const procedure = await getProcedure(id_tramite)
    if (procedure.estado === 'CONCLUIDO' || procedure.estado === 'ANULADO') throw ({ status: 400, message: `El tramite ya esta ${procedure.estado}` });
    const workflow = await SalidaModel.findOne({ tramite: id_tramite })
    if (workflow) throw ({ status: 400, message: 'El tramite ya ha sido enviado, por lo que no se puede concluir' });
    const event = `Tramite concluido debido a: ${descripcion}`
    await Promise.all([
        ExternoModel.findByIdAndUpdate(id_tramite, { estado: 'CONCLUIDO', $push: { eventos: { funcionario: id_funcionario, descripcion: event } } }),
        archivoService.archiveProcedure('tramites_externos', id_tramite, id_funcionario, id_dependencia, descripcion)
    ])
}

exports.cancelProcedure = async (id_tramite, id_funcionario, descripcion) => {
    const procedure = await getProcedure(id_tramite)
    if (procedure.estado === 'CONCLUIDO' || procedure.estado === 'ANULADO')
        throw ({ status: 400, message: `El tramite ya esta ${procedure.estado}` });
    const isSend = await SalidaModel.findOne({ tramite: id_tramite, tipo: 'tramites_externos', $or: [{ recibdo: null }, { recibido: true }] })
    if (isSend) throw ({ status: 400, message: 'El tramite ya ha sido enviado, por lo que no se puede anular' });
    const event = `Tramite anulado debido a: ${descripcion}`
    await ExternoModel.findByIdAndUpdate(id_tramite, { estado: 'ANULADO', $push: { eventos: { funcionario: id_funcionario, descripcion: event } } })
}


const addLeadingZeros = (num, totalLength) => {
    return String(num).padStart(totalLength, '0');
}
const getWorkflow = async (id_tramite) => {
    return await SalidaModel.find({ tramite: id_tramite }).select('-_id -__v')
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

}
const getProcedure = async (id_tramite) => {
    const procedure = await ExternoModel.findById(id_tramite)
        .populate('solicitante', '-_id -__v')
        .populate('representante', '-_id -__v')
        .populate('tipo_tramite', 'nombre -_id')
        .populate('eventos.funcionario', 'nombre paterno materno -_id')
        .populate({
            path: 'cuenta',
            select: '_id',
            populate: {
                path: 'funcionario',
                select: 'nombre paterno materno cargo -_id',
            }
        })
    if (!procedure) throw ({ status: 400, message: 'El tramite no existe' });
    return procedure
}

const getLocation = async (id_tramite) => {
    let location = await EntradaModel.find({ tramite: id_tramite })
        .select('receptor.cuenta -_id')
        .populate({
            path: 'receptor.cuenta',
            select: 'dependencia funcionario -_id',
            populate: [
                {
                    path: 'funcionario',
                    select: 'nombre paterno materno cargo -_id'
                },
                {
                    path: 'dependencia',
                    select: 'nombre -_id'
                }
            ]
        })
    if (location.length === 0) {
        location = await ExternoModel.findById(id_tramite)
            .select('cuenta -_id').populate({
                path: 'cuenta',
                select: 'funcionario dependencia -_id',
                populate: [
                    {
                        path: 'funcionario',
                        select: 'nombre paterno materno cargo -_id'
                    },
                    {
                        path: 'dependencia',
                        select: 'nombre -_id'
                    }
                ]
            })
        return [location]
    }
    location = location.map(element => element.receptor)
    return location

}