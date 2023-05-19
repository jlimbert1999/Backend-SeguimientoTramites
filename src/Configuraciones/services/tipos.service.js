
const TipoModel = require('../models/tipos.model')

exports.get = async (limit, offset) => {
    offset = parseInt(offset) ? offset : 0
    limit = parseInt(limit) ? limit : 10
    offset = offset * limit
    const [tipos, length] = await Promise.all(
        [
            TipoModel.find({}).sort({ _id: -1 }).skip(offset).limit(limit),
            TipoModel.count()
        ]
    )
    return { tipos, length }
}
exports.add = async (tipo) => {
    const tipoDB = new TipoModel(tipo);
    const newTipo = await tipoDB.save();
    return newTipo
}
exports.edit = async (id_tipo, tipo) => {
    const newTipo = await TipoModel.findByIdAndUpdate(id_tipo, tipo, { new: true })
    return newTipo
}
exports.delete = async (id_tipo) => {
    const tipoDB = await TipoModel.findById(id_tipo)
    if (!tipoDB) {
        throw ({ status: 400, message: 'El tipo de tramite no existe' });
    }
    const newTipo = await TipoModel.findByIdAndUpdate(id_tipo, { activo: !tipoDB.activo }, { new: true })
    return newTipo
}
exports.search = async (limit, offset, text) => {
    limit = parseInt(limit) || 10
    offset = parseInt(offset) || 0
    offset = offset * limit
    const regex = new RegExp(text, 'i')
    const [tipos, length] = await Promise.all(
        [
            TipoModel.find({ $or: [{ nombre: regex }, { segmento: regex }] }).skip(offset).limit(limit),
            TipoModel.find({ $or: [{ nombre: regex }, { segmento: regex }] }).count()
        ]
    )
    return { tipos, length }
}
exports.editRequirements = async (id_tipo, id_requisito, nombre) => {
    const tipoDB = await TipoModel.findOne({ _id: id_tipo })
    if (!tipoDB) {
        throw ({ status: 400, message: 'El tipo de tramite no existe' });
    }
    await TipoModel.updateOne({ "_id": id_tipo, "requerimientos._id": id_requisito }, {
        $set: { 'requerimientos.$.nombre': nombre }
    })
    let requisito = tipoDB.requerimientos.find(element => element._id == id_requisito);
    requisito.nombre = nombre
    return requisito
}
exports.deleteRequirements = async (id_tipo, id_requisito) => {
    const tipoDB = await TipoModel.findOne({ _id: id_tipo })
    if (!tipoDB) {
        throw ({ status: 400, message: 'El tipo de tramite no existe' });
    }
    let requisito = tipoDB.requerimientos.find(element => element._id == id_requisito);
    await TipoModel.updateOne({ "_id": id_tipo, "requerimientos._id": id_requisito }, {
        $set: { 'requerimientos.$.activo': !requisito.activo }
    })
    requisito.activo = !requisito.activo
    return requisito
}

exports.getProceduresTypesForRegister = async (groupProcedure, role = '') => {
    const typesProcedures = await TipoModel.find({ activo: true, tipo: groupProcedure }).select('nombre segmento requerimientos')
    typesProcedures.forEach((element, i) => {
        typesProcedures[i].requerimientos = element.requerimientos.filter(requerimiento => requerimiento.activo === true)
    })
    return typesProcedures
}

exports.getNameOfTypesProcedures = async (group) => {
    group = group === 'tramites_externos' ? 'EXTERNO' : 'INTERNO'
    return await TipoModel.find({ activo: true, tipo: group })
        .select('nombre')
}
