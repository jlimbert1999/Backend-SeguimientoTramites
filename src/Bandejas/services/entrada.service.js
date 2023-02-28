const EntradaModel = require('../models/entrada.model')
const SalidaModel = require('../models/salida.model')
const { ExternoModel } = require('../../Tramites/models/externo.model')
const CuentaModel = require("../../../src/Configuraciones/cuentas/cuenta.model");
const { default: mongoose } = require("mongoose");


class EntradaService {
    async get(id_cuenta, limit, offset) {
        offset = offset ? offset : 0;
        limit = limit ? limit : 50;
        offset = offset * limit;
        const [mails, length] = await Promise.all([
            EntradaModel.find({ 'receptor.cuenta': id_cuenta })
                .sort({ fecha_envio: -1 })
                .skip(offset)
                .limit(limit)
                .populate({
                    path: "tramite",
                    select: "alterno estado detalle",
                })
                .populate({
                    path: "emisor.cuenta",
                    select: "_id",
                    populate: {
                        path: "dependencia",
                        select: "nombre -_id",
                        populate: {
                            path: "institucion",
                            select: "sigla -_id",
                        },
                    },
                })
                .populate({
                    path: "emisor.funcionario",
                    select: "nombre paterno materno cargo",
                }),
            EntradaModel.count({ receptor: id_cuenta }),
        ]);
        return { mails, length }
    }

    async acept(id_bandeja) {
        const mail = await EntradaModel.findByIdAndUpdate(id_bandeja, {
            recibido: true,
        });
        if (!mail) {
            // if mail no exist, mail is canceled
            throw ({ status: 400, message: `El envio de este tramite ha sido cancelado` });
        }
        await SalidaModel.findOneAndUpdate(
            {
                tramite: mail.tramite,
                "emisor.cuenta": mail.emisor.cuenta,
                "receptor.cuenta": mail.receptor.cuenta,
                recibido: null,
            },
            { recibido: true, fecha_recibido: new Date() }
        );
        return 'Tramite aceptado'
    }




    async add(receptores, data, id_cuenta, id_funcionario) {
        let mails = [];
        for (const account of receptores) {
            const foundDuplicate = await EntradaModel.findOne({
                tramite: data.tramite,
                'receptor.cuenta': account._id,
                'emisor.cuenta': id_cuenta
            });
            if (foundDuplicate) {
                throw ({ status: 405, message: `El funcionario ${account.funcionario.nombre} ${account.funcionario.paterno} ${account.funcionario.materno} ya tiene el tramite en su bandeja de entrada` });
            }
            // Create dto for database
            mails.push({
                ...data,
                emisor: {
                    cuenta: id_cuenta,
                    funcionario: id_funcionario,
                },
                receptor: {
                    cuenta: account._id,
                    funcionario: account.funcionario._id,
                },
            });
        }

        await EntradaModel.findOneAndDelete({
            tramite: data.tramite,
            "receptor.cuenta": id_cuenta,
            recibido: true
        });
        await SalidaModel.insertMany(mails);
        let MailsDB = await EntradaModel.insertMany(mails)
        switch (data.tipo) {
            // case "tramites_internos":
            //     await TramiteInterno.findByIdAndUpdate(data.tramite, {
            //         estado: "EN REVISION",
            //     });
            //     break;
            case "tramites_externos":
                await ExternoModel.findByIdAndUpdate(data.tramite, {
                    estado: "EN REVISION",
                });
                break;
        }
        await EntradaModel.populate(MailsDB, [
            {
                path: "tramite",
                select: "alterno estado detalle",
            },
            {
                path: "emisor.cuenta",
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
                path: "emisor.funcionario",
                select: "nombre paterno materno cargo",
            }
        ])
        return MailsDB

    }

    async getAccounts(text, id_cuenta) {
        const regex = new RegExp(text, "i");
        const cuentas = await CuentaModel.aggregate([
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
                    "funcionario.nombre": 1,
                    "funcionario.paterno": 1,
                    "funcionario.materno": 1,
                    "funcionario.cargo": 1,
                    "funcionario._id": 1,
                    _id: 1,
                    activo: 1,
                },
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
                $match: {
                    $or: [
                        { "funcionario.fullname": regex },
                        { "funcionario.cargo": regex },
                    ],
                    activo: true,
                    _id: { $ne: mongoose.Types.ObjectId(id_cuenta) },
                },
            },
            {
                $project: {
                    activo: 0,
                },
            },
            { $limit: 4 },
        ]);
        return cuentas

    }



}





module.exports = EntradaService