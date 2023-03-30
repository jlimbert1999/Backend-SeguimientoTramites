
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
    async editRequirements(id_tipo, id_requisito, nombre) {
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
    async deleteRequirements(id_tipo, id_requisito) {
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
}
module.exports = TipoService