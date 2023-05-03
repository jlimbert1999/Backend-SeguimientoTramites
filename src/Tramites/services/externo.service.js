require('dotenv').config()
const ExternoModel = require('../models/externo.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const { default: mongoose } = require('mongoose')

exports.get = async (id_cuenta, limit, offset) => {
    offset = parseInt(offset) ? offset : 0
    limit = parseInt(limit) ? limit : 10
    offset = offset * limit
    const [tramites, total] = await Promise.all([
        await ExternoModel.find({ cuenta: id_cuenta, estado: { $ne: 'ANULADO' } })
            .sort({ _id: -1 })
            .skip(offset)
            .limit(limit)
            .populate('tipo_tramite', 'nombre'),
        await ExternoModel.count({ cuenta: id_cuenta, estado: { $ne: 'ANULADO' } })
    ]);
    return { tramites, total }
}
exports.search = async (text, limit, offset, id_cuenta) => {
    const regex = new RegExp(text, 'i')
    const data = await ExternoModel.aggregate([
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

    await ExternoModel.populate(data[0].paginatedResults, { path: 'tipo_tramite', select: 'nombre -_id' })
    let tramites = data[0].paginatedResults
    const length = data[0].totalCount[0] ? data[0].totalCount[0].count : 0
    return { tramites, length }
}
exports.add = async (id_cuenta, tramite, solicitante, representante) => {
    tramite.cuenta = id_cuenta
    tramite.alterno = `${tramite.alterno}-${process.env.CONFIG_YEAR}`
    if (representante) Object.assign(tramite, { representante })
    Object.assign(tramite, { solicitante })
    const regex = new RegExp(tramite.alterno, 'i')
    let correlativo = await ExternoModel.find({ alterno: regex }).count()
    correlativo += 1
    tramite.alterno = `${tramite.alterno}-${addLeadingZeros(correlativo, 6)}`
    tramite.pin = Math.floor(100000 + Math.random() * 900000)
    const newTramite = new ExternoModel(tramite)
    const tramiteDB = await newTramite.save()
    await ExternoModel.populate(tramiteDB, { path: 'tipo_tramite', select: 'nombre -_id' })
    return tramiteDB
}
exports.edit = async (id_tramite, updateData) => {
    let { tramite, solicitante, representante } = updateData
    const tramitedb = await ExternoModel.findById(id_tramite).select('estado')
    if (tramitedb.estado === 'ANULADO' || tramitedb.estado === 'CONCLUIDO') throw ({ status: 400, message: `El tramite no puede editarse. El estado es ${tramitedb.estado}` });
    const isSend = await SalidaModel.findOne({ tramite: id_tramite, recibido: true, tipo: 'tramites_externos' })
    if (isSend) throw ({ status: 400, message: 'El tramite ya ha sido aceptado para la evaluacion' });
    if (representante) Object.assign(tramite, { representante })
    Object.assign(tramite, { solicitante })
    return await ExternoModel.findByIdAndUpdate(id_tramite, tramite, { new: true })
        .populate('tipo_tramite', 'nombre -_id')
}
exports.getOne = async (id_tramite) => {
    const procedure = await ExternoModel.findById(id_tramite)
        .populate('tipo_tramite', 'nombre -_id')
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
exports.concludeProcedure = async (id_tramite) => {
    const procedure = await ExternoModel.findById(id_tramite)
    if (procedure.estado === 'CONCLUIDO' || procedure.estado === 'ANULADO') throw ({ status: 400, message: `El tramite ya esta ${procedure.estado}` });
    const workflow = await SalidaModel.findOne({ tramite: id_tramite })
    if (workflow) throw ({ status: 400, message: 'El tramite ya ha sido enviado, por lo que no se puede concluir' });
    await ExternoModel.findByIdAndUpdate(id_tramite, { estado: 'CONCLUIDO', fecha_finalizacion: new Date() })
}
exports.cancelProcedure = async (id_tramite) => {
    const procedure = await ExternoModel.findById(id_tramite)
    if (procedure.estado === 'CONCLUIDO' || procedure.estado === 'ANULADO') throw ({ status: 400, message: `El tramite ya esta ${procedure.estado}` });
    const isSend = await SalidaModel.findOne({ tramite: id_tramite, tipo: 'tramites_externos', $or: [{ recibdo: null }, { recibido: true }] })
    if (isSend) throw ({ status: 400, message: 'El tramite ya ha sido enviado, por lo que no se puede anular' });
    await ExternoModel.findByIdAndUpdate(id_tramite, { estado: 'ANULADO' })
}
const addLeadingZeros = (num, totalLength) => {
    return String(num).padStart(totalLength, '0');
}
