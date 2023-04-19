const SalidaModel = require('../models/salida.model')
const EntradaModel = require('../models/entrada.model')
const { ExternoModel } = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const { default: mongoose } = require("mongoose");

class SalidaService {
    async get(id_cuenta, limit, offset) {
        offset = offset ? parseInt(offset) : 0;
        limit = limit ? parseInt(limit) : 10;
        offset = offset * limit;
        const dataPaginated = await SalidaModel.aggregate([
            {
                $match: {
                    "emisor.cuenta": id_cuenta
                }
            },
            {
                $lookup: {
                    from: "cuentas",
                    localField: "receptor.cuenta",
                    foreignField: "_id",
                    as: "receptor.cuenta",
                },
            },
            {
                $unwind: "$receptor.cuenta"
            },
            {
                $project: {
                    'receptor.cuenta.funcionario': 0,
                    'receptor.cuenta.login': 0,
                    'receptor.cuenta.password': 0,
                    'receptor.cuenta.rol': 0,
                    'receptor.cuenta.activo': 0,
                    'receptor.cuenta.__v': 0,
                }
            },
            {
                $lookup: {
                    from: "funcionarios",
                    localField: "receptor.funcionario",
                    foreignField: "_id",
                    as: "receptor.funcionario",
                },
            },
            {
                $unwind: "$receptor.funcionario"
            },
            {
                $project: {
                    'receptor.funcionario.activo': 0,
                    'receptor.funcionario._id': 0,
                    'receptor.funcionario.__v': 0,
                    'receptor.funcionario.cuenta': 0,
                    'receptor.funcionario.direccion': 0,
                    'receptor.funcionario.dni': 0,
                    'receptor.funcionario.telefono': 0,
                }
            },
            {
                $lookup: {
                    from: "dependencias",
                    localField: "receptor.cuenta.dependencia",
                    foreignField: "_id",
                    as: "receptor.cuenta.dependencia",
                },
            },
            {
                $unwind: "$receptor.cuenta.dependencia"
            },
            {
                $project: {
                    'receptor.cuenta.dependencia.activo': 0,
                    'receptor.cuenta.dependencia.sigla': 0,
                    'receptor.cuenta.dependencia.codigo': 0,
                    'receptor.cuenta.dependencia._id': 0,
                    'receptor.cuenta.dependencia.__v': 0,
                }
            },
            {
                $lookup: {
                    from: "instituciones",
                    localField: "receptor.cuenta.dependencia.institucion",
                    foreignField: "_id",
                    as: "receptor.cuenta.dependencia.institucion",
                },
            },
            {
                $unwind: "$receptor.cuenta.dependencia.institucion"
            },
            {
                $project: {
                    'receptor.cuenta.dependencia.institucion.sigla': 0,
                    'receptor.cuenta.dependencia.institucion.activo': 0,
                    'receptor.cuenta.dependencia.institucion._id': 0,
                    'receptor.cuenta.dependencia.institucion.__v': 0,
                }
            },
            {
                $group: {
                    _id: {
                        'cuenta': '$emisor.cuenta',
                        'tramite': '$tramite',
                        'tipo': '$tipo',
                        'fecha_envio': '$fecha_envio'
                    },
                    envios: { $push: "$$ROOT" }
                }
            },
            { $sort: { _id: -1 } },
            {
                $facet: {
                    paginatedResults: [{ $skip: offset }, { $limit: limit }],
                    totalCount: [
                        {
                            $count: 'count'
                        }
                    ]
                }
            },
        ])
        let mails = dataPaginated[0].paginatedResults
        for (const [i, mail] of Object.entries(mails)) {
            let procedure
            if (mail._id.tipo === 'tramites_externos') {
                procedure = await ExternoModel.findById(mail._id.tramite)
                    .select('alterno estado')
                    .populate('tipo_tramite', 'nombre -_id')
            }
            else if (mail._id.tipo === 'tramites_internos') {
                procedure = await InternoModel.findById(mail._id.tramite)
                    .select('alterno estado')
                    .populate('tipo_tramite', 'nombre -_id')
            }
            mails[i]._id.tramite = procedure
        }
        const length = dataPaginated[0].totalCount[0] ? dataPaginated[0].totalCount[0].count : 0
        return { mails, length }
    }


    async cancel(id_bandeja, id_cuenta) {
        const cancelMail = await SalidaModel.findById(id_bandeja)
        if (cancelMail.recibido !== undefined) {
            throw ({ status: 400, message: 'El tramite ya ha sido evaluado por el funcionario receptor.' });
        }
        await Promise.all([
            SalidaModel.findByIdAndDelete(id_bandeja),
            EntradaModel.findOneAndDelete({ tramite: cancelMail.tramite, 'emisor.cuenta': cancelMail.emisor.cuenta, 'receptor.cuenta': cancelMail.receptor.cuenta })
        ])
        // verify if all send for update state
        const processActive = await EntradaModel.findOne({ tramite: cancelMail.tramite, 'emisor.cuenta': id_cuenta })
        if (!processActive) {
            const existWorkflow = await SalidaModel.findOne({ tramite: cancelMail.tramite })
            if (existWorkflow) {
                // revert delete mail entrada for send
                let mailOld = await SalidaModel.findOne({ tramite: cancelMail.tramite, 'receptor.cuenta': id_cuenta, recibido: true }).sort({ _id: -1 })
                mailOld = mailOld.toObject()
                delete mailOld._id
                delete mailOld.__v
                const newMailOld = new EntradaModel(mailOld)
                await newMailOld.save()
                return `El tramite ahora se ecuentra en su bandeja de entrada`
            }
            else {
                let tramiteDB
                switch (cancelMail.tipo) {
                    case "tramites_internos":
                        tramiteDB = await InternoModel.findByIdAndUpdate(cancelMail.tramite, {
                            estado: "INSCRITO",
                        });
                        break;
                    case "tramites_externos":
                        tramiteDB = await ExternoModel.findByIdAndUpdate(cancelMail.tramite, {
                            estado: "INSCRITO",
                        });
                        break;
                }
                return `Todos los envios realizados para el tramite: ${tramiteDB.alterno} se han cancelado. El estado ahora es: INSCRITO.`
            }
        }
        return 'Se ha cancelado uno de sus envios correctamente'
    }


    async search(id_cuenta, text, type, offset, limit) {
        offset = offset ? parseInt(offset) : 0;
        limit = limit ? parseInt(limit) : 10;
        offset = offset * limit;
        const regex = new RegExp(text, "i");
        let data
        if (type === 'EXTERNO') {
            data = await SalidaModel.aggregate([
                {
                    $match: {
                        tipo: 'tramites_externos'
                    },
                },
                {
                    $lookup: {
                        from: "tramites_externos",
                        localField: "tramite",
                        foreignField: "_id",
                        as: "tramite",
                    },
                },
                {
                    $unwind: "$tramite"
                },
                {
                    $match: {
                        'emisor.cuenta': mongoose.Types.ObjectId(id_cuenta),
                        $or: [
                            { "tramite.alterno": regex },
                            { "tramite.detalle": regex },
                            { motivo: regex },
                            { numero_interno: regex },
                        ]
                    },
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
        }
        else if (type === 'INTERNO') {
            data = await SalidaModel.aggregate([
                {
                    $match: {
                        tipo: 'tramites_internos'
                    },
                },
                {
                    $lookup: {
                        from: "tramites_internos",
                        localField: "tramite",
                        foreignField: "_id",
                        as: "tramite",
                    },
                },
                {
                    $unwind: "$tramite"
                },
                {
                    $match: {
                        'emisor.cuenta': mongoose.Types.ObjectId(id_cuenta),
                        $or: [
                            { "tramite.alterno": regex },
                            { "tramite.detalle": regex },
                            { motivo: regex },
                            { numero_interno: regex },
                        ]
                    },
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
        }
        await SalidaModel.populate(data[0].paginatedResults, [
            {
                path: "receptor.cuenta",
                select: "_id",
                populate: {
                    path: "dependencia",
                    select: "nombre -_id",
                    populate: {
                        path: "institucion",
                        select: "sigla -_id",
                    },
                },
            },
            {
                path: "receptor.funcionario",
                select: "nombre paterno materno cargo",
            }
        ])
        const mails = data[0].paginatedResults
        const length = data[0].totalCount[0] ? data[0].totalCount[0].count : 0
        return { mails, length }
    }
}





module.exports = SalidaService