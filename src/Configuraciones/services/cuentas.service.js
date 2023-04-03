
const { default: mongoose } = require("mongoose");
const CuentaModel = require('../models/cuentas.model')
const DependenciaModel = require('../models/dependencias.model')

class CuentaService {
    async getDependencias(id_institucion) {
        const dependencias = DependenciaModel.find({ institucion: id_institucion, activo: true })
        return dependencias
    }

    async get(limit, offset) {
        offset = parseInt(offset) ? offset : 0
        limit = parseInt(limit) ? limit : 10
        offset = offset * limit
        const [cuentas, length] = await Promise.all(
            [
                CuentaModel.find({ rol: { $ne: 'admin' } }).select('login rol activo').sort({ _id: -1 }).skip(offset).limit(limit).populate({
                    path: 'dependencia',
                    select: 'nombre -_id',
                    populate: {
                        path: 'institucion',
                        select: 'sigla -_id'
                    }
                }).populate('funcionario'),
                CuentaModel.count({ rol: { $ne: 'admin' } })
            ]
        )
        return { cuentas, length }

    }
    // async add(dependencia) {
    //     const { sigla, codigo } = dependencia
    //     if (!sigla || !codigo) {
    //         throw ({ status: 400, message: 'La dependencia debe tener una sigla y un codigo' });
    //     }
    //     const duplicado = await DependenciaModel.findOne(
    //         { $or: [{ sigla }, { codigo }] }
    //     );
    //     if (duplicado) {
    //         throw ({ status: 400, message: 'El codigo o sigla de la dependencia ya existen' });
    //     }
    //     const newDependencia = new DependenciaModel(dependencia);
    //     const dependenciadb = await newDependencia.save();
    //     await DependenciaModel.populate(dependenciadb, { path: 'institucion', select: 'sigla' })
    //     return dependenciadb

    // }
    // async edit(id_dependencia, dependencia) {
    //     const { sigla, codigo } = dependencia
    //     if (!sigla || !codigo) {
    //         throw ({ status: 400, message: 'La dependencia debe tener una sigla y un codigo' });
    //     }
    //     const dependenciadb = await DependenciaModel.findById(id_dependencia);
    //     if (!dependenciadb) {
    //         return res.status(400).json({
    //             ok: false,
    //             message: "La dependencia no existe",
    //         });
    //     }
    //     if (dependenciadb.sigla !== sigla) {
    //         const existeSigla = await DependenciaModel.findOne({ sigla });
    //         if (existeSigla) {
    //             throw ({ status: 400, message: 'La sigla de la dependencia ya existe' });
    //         }
    //     }
    //     if (dependenciadb.codigo !== codigo) {
    //         const existeCodigo = await DependenciaModel.findOne({ codigo });
    //         if (existeCodigo) {
    //             throw ({ status: 400, message: 'El codigo de la dependencia ya existe' });
    //         }
    //     }
    //     const newDependencia = await DependenciaModel.findByIdAndUpdate(
    //         id_dependencia,
    //         dependencia,
    //         { new: true }
    //     ).populate("institucion", "sigla");
    //     return newDependencia
    // }

    // async delete(id_dependencia) {
    //     const dependenciadb = await DependenciaModel.findById(id_dependencia)
    //     if (!dependenciadb) {
    //         throw ({ status: 400, message: 'La dependencia no existe' });
    //     }
    //     const newDependencia = await DependenciaModel.findByIdAndUpdate(id_dependencia, { activo: !dependenciadb.activo }, { new: true }).populate("institucion", "sigla")
    //     return newDependencia
    // }

    async search(limit, offset, text, institucion, dependencia) {
        limit = parseInt(limit) || 10
        offset = parseInt(offset) || 0
        offset = offset * limit
        let query = {}
        if (institucion) {
            Object.assign(query, { 'dependencia.institucion._id': mongoose.Types.ObjectId(institucion) })
            if (dependencia) {
                Object.assign(query, { 'dependencia._id': mongoose.Types.ObjectId(dependencia) })
            }
        }
        if (text) {
            Object.assign(query, {
                $or: [
                    { "funcionario.fullname": new RegExp(text, 'i') },
                    { "funcionario.cargo": new RegExp(text, 'i') },
                    { "funcionario.dni": new RegExp(text, 'i') }
                ],
            })
        }
        const data = await CuentaModel.aggregate([
            {
                $lookup: {
                    from: "dependencias",
                    localField: "dependencia",
                    foreignField: "_id",
                    as: "dependencia",
                },
            },
            {
                $unwind: {
                    path: "$dependencia",
                },
            },
            {
                $project: {
                    password: 0,
                    __v: 0,
                    'dependencia.activo': 0,
                    'dependencia.__v': 0,
                    'dependencia.codigo': 0,
                    'dependencia.sigla': 0,
                }
            },
            {
                $lookup: {
                    from: "instituciones",
                    localField: "dependencia.institucion",
                    foreignField: "_id",
                    as: "dependencia.institucion",
                },
            },
            {
                $unwind: {
                    path: "$dependencia.institucion",
                },
            },
            {
                $project: {
                    'dependencia.institucion.activo': 0,
                    'dependencia.institucion.__v': 0,
                }
            },
            {
                $lookup: {
                    from: "funcionarios",
                    localField: "funcionario",
                    foreignField: "_id",
                    as: "funcionario",
                },
            },
            {
                $unwind: {
                    path: "$funcionario",
                },
            },
            {
                $project: {
                    'funcionario.activo': 0,
                    'funcionario.__v': 0,
                }
            },
            {
                $addFields: {
                    "funcionario.fullname": {
                        $concat: [
                            "$funcionario.nombre",
                            " ",
                            { $ifNull: ["$funcionario.paterno", ""] },
                            " ",
                            { $ifNull: ["$funcionario.materno", ""] },
                        ],
                    },
                },
            },
            {
                $match: query
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
        const cuentas = data[0].paginatedResults
        const length = data[0].totalCount[0] ? data[0].totalCount[0].count : 0
        return { cuentas, length }
    }
}



module.exports = CuentaService