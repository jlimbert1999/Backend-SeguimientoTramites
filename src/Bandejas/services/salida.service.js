const SalidaModel = require('../models/salida.model')
const EntradaModel = require('../models/entrada.model')
const ExternoModel = require('../../Tramites/models/externo.model')
const InternoModel = require('../../Tramites/models/interno.model')
const { default: mongoose } = require("mongoose");

exports.get = async (id_cuenta, limit, offset) => {
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
                sendings: { $push: "$$ROOT" }
            }
        },
        { $sort: { '_id.fecha_envio': -1 } },
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
                .select('alterno estado detalle')
                .populate('tipo_tramite', 'nombre -_id')
        }
        else if (mail._id.tipo === 'tramites_internos') {
            procedure = await InternoModel.findById(mail._id.tramite)
                .select('alterno estado detalle')
                .populate('tipo_tramite', 'nombre -_id')
        }
        mails[i]._id.tramite = procedure
    }
    const length = dataPaginated[0].totalCount[0] ? dataPaginated[0].totalCount[0].count : 0
    return { mails, length }
}
exports.search = async (id_cuenta, text, group, offset, limit) => {
    offset = offset ? parseInt(offset) : 0;
    limit = limit ? parseInt(limit) : 10;
    offset = offset * limit;
    const regex = new RegExp(text, "i");
    group = group === 'EXTERNO' ? 'tramites_externos' : 'tramites_internos'
    const dataPaginated = await SalidaModel.aggregate([
        {
            $match: {
                tipo: group,
                'emisor.cuenta': mongoose.Types.ObjectId(id_cuenta),
            },
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
                sendings: { $push: "$$ROOT" }
            }
        },
        { $sort: { '_id.fecha_envio': -1 } },
        {
            $lookup: {
                from: group,
                localField: "_id.tramite",
                foreignField: "_id",
                as: "_id.tramite",
            },
        },
        {
            $unwind: "$_id.tramite"
        },
        {
            $project: {
                '_id.tramite.estado': 1,
                '_id.tramite.alterno': 1,
                '_id.tramite.detalle': 1,
                '_id.tramite.cite': 1,
                '_id.cuenta': 1,
                '_id.fecha_envio': 1,
                '_id.tipo': 1,
                'sendings': 1
            }
        },
        {
            $match: {
                $or: [
                    { "_id.tramite.alterno": regex },
                    { "_id.tramite.detalle": regex },
                    { "_id.tramite.cite": regex }
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
        },
    ])
    const mails = dataPaginated[0].paginatedResults
    const length = dataPaginated[0].totalCount[0] ? dataPaginated[0].totalCount[0].count : 0
    return { mails, length }
}
exports.cancelOneSend = async (id_bandeja) => {
    const mail = await SalidaModel.findById(id_bandeja)
    if (!mail) throw ({ status: 400, message: 'No se encontro el envio realizado.' });
    if (mail.recibido !== undefined) throw ({ status: 400, message: 'El tramite ya ha sido evaluado por el funcionario receptor.' });
    await Promise.all([
        SalidaModel.findByIdAndDelete(id_bandeja),
        EntradaModel.findOneAndDelete({ tramite: mail.tramite, 'emisor.cuenta': mail.emisor.cuenta, 'receptor.cuenta': mail.receptor.cuenta, recibido: false })
    ])
    const existWorkflow = await SalidaModel.findOne({ tramite: mail.tramite })
    if (!existWorkflow) {
        let tramiteDB = mail.tipo === 'tramites_externos'
            ? await ExternoModel.findByIdAndUpdate(mail.tramite, { estado: "INSCRITO" })
            : await InternoModel.findByIdAndUpdate(mail.tramite, { estado: "INSCRITO" })
        return `Todos los envios realizados para el tramite: ${tramiteDB.alterno} se han cancelado. El estado ahora es: INSCRITO.`
    }
    await recoverLastmail(mail.tramite, mail.emisor.cuenta)
    return `El tramite ahora se ecuentra en su bandeja de entrada`
}
exports.cancelAllSend = async (id_cuenta, id_tramite, fecha_envio) => {
    const sendMails = await SalidaModel.find({ tramite: id_tramite, 'emisor.cuenta': id_cuenta, fecha_envio: new Date(fecha_envio) })
    if (sendMails.length === 0) throw ({ status: 400, message: 'No se econtraron los envios para cancelar' });
    sendMails.forEach(mail => {
        if (mail.recibido !== undefined) throw ({ status: 400, message: 'No se puede cancelar el envio. Algunos funcionarios ya han evaluado el tramite' });
    })
    for (const mail of sendMails) {
        await Promise.all([
            SalidaModel.findByIdAndDelete(mail._id),
            EntradaModel.findOneAndDelete({ tramite: id_tramite, 'emisor.cuenta': id_cuenta, 'receptor.cuenta': mail.receptor.cuenta })
        ])
    }
    const existWorkflow = await SalidaModel.findOne({ tramite: id_tramite })
    if (!existWorkflow) {
        const tramiteDB = sendMails[0].tipo === 'tramites_externos'
            ? await ExternoModel.findByIdAndUpdate(id_tramite, { estado: "INSCRITO" })
            : await InternoModel.findByIdAndUpdate(id_tramite, { estado: "INSCRITO" })
        return `Todos los envios realizados para el tramite: ${tramiteDB.alterno} se han cancelado. El estado ahora es: INSCRITO.`
    }
    await recoverLastmail(id_tramite, id_cuenta)
    return `El tramite ahora se ecuentra en su bandeja de entrada`
}

const recoverLastmail = async (id_procedure, id_emiter) => {
    let mailOld = await SalidaModel.findOne({ tramite: id_procedure, 'receptor.cuenta': id_emiter, recibido: true }).sort({ _id: -1 })
    mailOld = mailOld.toObject()
    delete mailOld._id
    delete mailOld.__v
    return await EntradaModel.findOneAndUpdate({ tramite: mailOld.tramite, 'receptor.cuenta': mailOld.receptor.cuenta, 'emisor.cuenta': mailOld.emisor.cuenta, recibido: mailOld.recibido }, mailOld, { upsert: true, new: true })
}
exports.getWorkflowProcedure = async (id_procedure) => {
    return await SalidaModel.find({ tramite: id_procedure }).select('-_id -__v')
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