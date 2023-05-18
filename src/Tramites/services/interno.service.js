const InternoModel = require('../models/interno.model')
const SalidaModel = require('../../Bandejas/models/salida.model')
const { generateAlterno } = require('../../../helpers/Alterno')
exports.get = async (id_cuenta, limit, offset) => {
    const [tramites, length] = await Promise.all([
        InternoModel.find({ cuenta: id_cuenta, estado: { $ne: 'ANULADO' } }).sort({ _id: -1 })
            .populate('tipo_tramite', 'nombre')
            .skip(offset)
            .limit(limit),
        InternoModel.count({ cuenta: id_cuenta, estado: { $ne: 'ANULADO' } })
    ])
    return { tramites, length }
}
exports.getOne = async (id_procedure) => {
    const procedure = await InternoModel.findOne({ _id: id_procedure })
        .populate('tipo_tramite', 'nombre')
        .populate({
            path: 'cuenta',
            select: '_id',
            populate: {
                path: 'funcionario',
                select: 'nombre paterno materno cargo -_id'
            }
        })
    if (!procedure) throw ({ status: 404, message: 'El tramite no existe' });
    return procedure
}
exports.add = async (tramite, id_cuenta) => {
    tramite.alterno = await generateAlterno(id_cuenta, tramite.tipo_tramite, 'tramites_internos')
    tramite.cuenta = id_cuenta
    const newTramite = new InternoModel(tramite)
    const tramiteDB = await newTramite.save()
    await InternoModel.populate(tramiteDB, { path: 'tipo_tramite', select: 'nombre' })
    return tramiteDB
}
exports.edit = async (id_procedure, procedure) => {
    const procedureDB = await InternoModel.findById(id_procedure)
    if (procedureDB.estado === 'ANULADO' || procedureDB.estado === 'CONCLUIDO') throw ({ status: 400, message: `El tramite ya esta ${procedureDB.estado}` });
    const isSend = await SalidaModel.findOne({ tramite: id_procedure, recibido: true, tipo: 'tramites_internos' })
    if (isSend) throw ({ status: 405, message: 'El tramite ya ha sido aceptado para la evaluacion' });
    return await InternoModel.findByIdAndUpdate(id_procedure, procedure, { new: true })
        .populate('tipo_tramite', 'nombre')
}
exports.search = async (id_cuenta, limit, offset, text) => {
    const regex = new RegExp(text, 'i')
    const [tramites, length] = await Promise.all([
        InternoModel.find({ cuenta: id_cuenta, estado: { $ne: 'ANULADO' }, $or: [{ alterno: regex }, { detalle: regex }, { cite: regex }, { 'destinatario.nombre': regex }] })
            .skip(offset)
            .limit(limit)
            .populate('tipo_tramite', 'nombre'),
        InternoModel.count({ cuenta: id_cuenta, estado: { $ne: 'ANULADO' }, $or: [{ alterno: regex }, { detalle: regex }, { cite: regex }, { 'destinatario.nombre': regex }] })
    ])
    return { tramites, length }
}
exports.concludeProcedure = async (id_procedure) => {
    const procedure = await InternoModel.findById(id_procedure)
    if (procedure.estado === 'CONCLUIDO' || procedure.estado === 'ANULADO') throw ({ status: 400, message: `El tramite ya esta ${procedure.estado}` });
    const workflow = await SalidaModel.findOne({ tramite: id_procedure })
    if (workflow) throw ({ status: 400, message: 'El tramite ya ha sido enviado, por lo que no se puede concluir' });
    await InternoModel.findByIdAndUpdate(id_procedure, { estado: 'CONCLUIDO', fecha_finalizacion: new Date() })
}
// exports.cancelProcedure = async (id_procedure) => {
//     const procedure = await InternoModel.findById(id_procedure)
//     if (procedure.estado === 'CONCLUIDO' || procedure.estado === 'ANULADO') throw ({ status: 400, message: `El tramite ya esta ${procedure.estado}` });
//     const isSend = await SalidaModel.findOne({ tramite: id_procedure, tipo: 'tramites_internos', $or: [{ recibdo: null }, { recibido: true }] })
//     if (isSend) throw ({ status: 400, message: 'El tramite ya ha sido enviado, por lo que no se puede anular' });
//     await InternoModel.findByIdAndUpdate(id_procedure, { estado: 'ANULADO' })
// }