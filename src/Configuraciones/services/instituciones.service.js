
const InstitucionModel = require('../models/instituciones.model')


exports.get = async (limit, offset) => {
    offset = parseInt(offset) ? offset : 0
    limit = parseInt(limit) ? limit : 10
    offset = offset * limit
    const [instituciones, length] = await Promise.all(
        [
            InstitucionModel.find({}).sort({ _id: -1 }).skip(offset).limit(limit),
            InstitucionModel.count()
        ]
    )
    return { instituciones, length }
};
exports.add = async (institucion) => {
    if (!institucion.sigla) {
        throw ({ status: 400, message: 'La institucion debe tener una sigla' });
    }
    const existeSigla = await InstitucionModel.findOne({ sigla: institucion.sigla })
    if (existeSigla) {
        throw ({ status: 400, message: 'Ya existe una institucion con la sigla introducida' });

    }
    const newInstitucion = new InstitucionModel(institucion)
    const institucionDB = await newInstitucion.save()
    return institucionDB
};
exports.edit = async (id_institucion, institucion) => {
    const { sigla } = institucion
    if (!sigla) {
        throw ({ status: 400, message: 'La institucion debe tener una sigla' });
    }
    const instituciondb = await InstitucionModel.findById(id_institucion)
    if (!instituciondb) {
        throw ({ status: 400, message: 'La institucion no existe' });
    }
    if (instituciondb.sigla !== sigla) {
        const existeSigla = await InstitucionModel.findOne({ sigla })
        if (existeSigla) {
            throw ({ status: 400, message: 'Ya existe una institucion con la sigla introducida' });
        }
    }
    const newInstitucion = await InstitucionModel.findByIdAndUpdate(id_institucion, institucion, { new: true })
    return newInstitucion
};

exports.delete = async (id_institucion) => {
    const instituciondb = await InstitucionModel.findById(id_institucion)
    if (!instituciondb) {
        throw ({ status: 400, message: 'La institucion no existe' });
    }
    const newInstitucion = await InstitucionModel.findByIdAndUpdate(id_institucion, { activo: !instituciondb.activo }, { new: true })
    return newInstitucion
};

exports.search = async (limit, offset, text) => {
    limit = parseInt(limit) || 10
    offset = parseInt(offset) || 0
    offset = offset * limit
    const regex = new RegExp(text, 'i')
    const [instituciones, length] = await Promise.all(
        [
            InstitucionModel.find({ $or: [{ nombre: regex }, { sigla: regex }] }).skip(offset).limit(limit),
            InstitucionModel.find({ $or: [{ nombre: regex }, { sigla: regex }] }).count()
        ]
    )
    return { instituciones, length }
};

exports.getActiveIntituciones = async () => {
    return await InstitucionModel.find({ activo: true }, "nombre sigla");
};

