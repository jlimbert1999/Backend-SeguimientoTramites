
const TipoModel = require('../models/tipos.model')

class TipoService {
    async get(limit, offset) {
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
    async add(tipo) {
        const tipoDB = new TipoModel(tipo);
        const newTipo = await tipoDB.save();
        return newTipo
    }
    async edit(id_tipo, tipo) {
        const newTipo = await TipoModel.findByIdAndUpdate(id_tipo, tipo, { new: true })
        return newTipo
    }

    async delete(id_tipo) {
        const tipoDB = await TipoModel.findById(id_tipo)
        if (!tipoDB) {
            throw ({ status: 400, message: 'El tipo de tramite no existe' });
        }
        const newTipo = await TipoModel.findByIdAndUpdate(id_tipo, { activo: !tipoDB.activo }, { new: true })
        return newTipo
    }

    async search(limit, offset, text) {
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
    async editRequirements(id_tipo, id_requisito, requerimientos) {
        let cambiosRequerimiento = {}
        // crear campos a actualizar en array requerimientos
        for (const [key, value] of Object.entries(requerimientos)) {
            cambiosRequerimiento[`requerimientos.$.${key}`] = value
        }
        const newTipo = await TipoModel.updateOne({ "_id": id_tipo, "requerimientos._id": id_requisito }, {
            $set: cambiosRequerimiento
        }, { new: true })
        return newTipo

    }
}
module.exports = TipoService