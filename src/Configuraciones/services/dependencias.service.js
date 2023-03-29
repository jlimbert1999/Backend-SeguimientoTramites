
const DependenciaModel = require('../models/dependencias.model')
const InstitucionModel = require('../models/instituciones.model')
class DependenciaService {

    async getInstituciones() {
        const instituciones = await InstitucionModel.find({ activo: true }, "nombre sigla");
        return instituciones
    };

    async get(limit, offset) {
        offset = parseInt(offset) ? offset : 0
        limit = parseInt(limit) ? limit : 10
        offset = offset * limit
        const [dependencias, length] = await Promise.all([
            DependenciaModel.find({}).sort({ _id: -1 })
                .populate("institucion", "sigla")
                .skip(offset)
                .limit(limit),
            DependenciaModel.count(),
        ]);
        return { dependencias, length }
    }
    async add(dependencia) {
        const { sigla, codigo } = dependencia
        if (!sigla || !codigo) {
            throw ({ status: 400, message: 'La dependencia debe tener una sigla y un codigo' });
        }
        const duplicado = await DependenciaModel.findOne(
            { $or: [{ sigla }, { codigo }] }
        );
        if (duplicado) {
            throw ({ status: 400, message: 'El codigo o sigla de la dependencia ya existen' });
        }
        const newDependencia = new DependenciaModel(dependencia);
        const dependenciadb = await newDependencia.save();
        await DependenciaModel.populate(dependenciadb, { path: 'institucion', select: 'sigla' })
        return dependenciadb

    }
    async edit(id_dependencia, dependencia) {
        const { sigla, codigo } = dependencia
        if (!sigla || !codigo) {
            throw ({ status: 400, message: 'La dependencia debe tener una sigla y un codigo' });
        }
        const dependenciadb = await DependenciaModel.findById(id_dependencia);
        if (!dependenciadb) {
            return res.status(400).json({
                ok: false,
                message: "La dependencia no existe",
            });
        }
        if (dependenciadb.sigla !== sigla) {
            const existeSigla = await DependenciaModel.findOne({ sigla });
            if (existeSigla) {
                throw ({ status: 400, message: 'La sigla de la dependencia ya existe' });
            }
        }
        if (dependenciadb.codigo !== codigo) {
            const existeCodigo = await DependenciaModel.findOne({ codigo });
            if (existeCodigo) {
                throw ({ status: 400, message: 'El codigo de la dependencia ya existe' });
            }
        }
        const newDependencia = await DependenciaModel.findByIdAndUpdate(
            id_dependencia,
            dependencia,
            { new: true }
        ).populate("institucion", "sigla");
        return newDependencia
    }

    async delete(id_dependencia) {
        const dependenciadb = await DependenciaModel.findById(id_dependencia)
        if (!dependenciadb) {
            throw ({ status: 400, message: 'La dependencia no existe' });
        }
        const newDependencia = await DependenciaModel.findByIdAndUpdate(id_dependencia, { activo: !dependenciadb.activo }, { new: true }).populate("institucion", "sigla")
        return newDependencia
    }

    async search(limit, offset, text) {
        limit = parseInt(limit) || 10
        offset = parseInt(offset) || 0
        offset = offset * limit
        const regex = new RegExp(text, 'i')
        const [dependencias, length] = await Promise.all(
            [
                DependenciaModel.find({ $or: [{ nombre: regex }, { sigla: regex }] }).skip(offset).limit(limit).populate("institucion", "sigla"),
                DependenciaModel.find({ $or: [{ nombre: regex }, { sigla: regex }] }).count()
            ]
        )
        return { dependencias, length }
    }

}



module.exports = DependenciaService