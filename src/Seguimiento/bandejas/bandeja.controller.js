const BandejaEntrada = require('./bandeja-entrada.model')
const BandejaSalida = require('./bandeja-salida.model')
const Cuenta = require('../../../src/Configuraciones/cuentas/cuenta.model')
const { TramiteExterno } = require('../externos/externo.model')
const TramiteInterno = require('../../Seguimiento/internos/interno.model')
const Usuarios = require('../../Configuraciones/usuarios/usuarios.model')
const { ErrorResponse, SuccessResponse } = require('../../../helpers/responses')

const { request, response } = require('express')
const { default: mongoose } = require('mongoose')

const addMail = async (req = request, res = response) => {
    const data = req.body
    let mailsIn = []
    let mailsOut = []
    const fecha = new Date()

    // data.forEach(mail => {
    //     mailsIn.push({
    //         tramite: mail.id_tramite,
    //         emisor: mail.emisor.cuenta,
    //         receptor: mail.receptor.cuenta,
    //         recibido: false,
    //         motivo: mail.motivo,
    //         cantidad: mail.cantidad,
    //         fecha_envio: fecha,
    //         tipo: mail.tipo
    //     })
    //     mailsOut.push({
    //         tramite: mail.id_tramite,
    //         emisor: mail.emisor,
    //         receptor: mail.receptor,
    //         motivo: mail.motivo,
    //         cantidad: mail.cantidad,
    //         fecha_envio: fecha,
    //         tipo: mail.tipo,
    //         numero_interno: mail.numero_interno
    //     })
    // })
    try {
        // Verify if mail is acepted before send
        // const mailOld = await BandejaEntrada.findOne({ receptor: req.id_cuenta, tramite: id_tramite })
        // if (mailOld) {
        //     if (!mailOld.recibido) {
        //         return res.status(405).json({
        //             ok: false,
        //             message: 'El tramite aun no ha sido aceptado para su reeenvio.'
        //         })
        //     }
        // }
        // await BandejaSalida.create(mail_salida)
        // const mail = await BandejaEntrada.findOneAndUpdate({ tramite: id_tramite }, mail_entrada, { upsert: true, new: true })
        // switch (tipo) {
        //     case 'tramites_internos':
        //         await TramiteInterno.findByIdAndUpdate(id_tramite, { ubicacion: receptor.cuenta })
        //         break;
        //     case 'tramites_externos':
        //         await TramiteExterno.findByIdAndUpdate(id_tramite, { ubicacion: receptor.cuenta })
        //         break;
        // }
        // await BandejaEntrada.populate(mail, {
        //     path: 'tramite',
        //     select: 'alterno estado detalle',
        //     populate: {
        //         path: 'tipo_tramite',
        //         select: 'nombre -_id'
        //     }
        // })
        // await BandejaEntrada.populate(mail, {
        //     path: 'emisor',
        //     select: '_id',
        //     populate: [
        //         {
        //             path: 'dependencia',
        //             select: 'nombre -_id',
        //             populate: {
        //                 path: 'institucion',
        //                 select: 'sigla -_id'
        //             }
        //         },
        //         {
        //             path: 'funcionario',
        //             select: 'nombre paterno materno cargo',
        //         }
        //     ]
        // })
        // res.json({
        //     ok: true,
        //     mail
        // })

    } catch (error) {
        return ErrorResponse(res, error)
    }
}

const getMailsIn = async (req = request, res = response) => {
    const id_cuenta = req.id_cuenta
    let { offset, limit } = req.query
    offset = offset ? offset : 0
    limit = limit ? limit : 50
    offset = offset * limit
    try {
        const [tramites, total] = await Promise.all([
            BandejaEntrada.find({ receptor: id_cuenta })
                .sort({ fecha_envio: -1 })
                .skip(offset)
                .limit(limit)
                .populate({
                    path: 'tramite',
                    select: 'alterno estado detalle',
                    populate: {
                        path: 'tipo_tramite',
                        select: 'nombre -_id'
                    }
                })
                .populate({
                    path: 'emisor',
                    select: '_id',
                    populate: [
                        {
                            path: 'dependencia',
                            select: 'nombre -_id',
                            populate: {
                                path: 'institucion',
                                select: 'sigla -_id'
                            }
                        },
                        {
                            path: 'funcionario',
                            select: 'nombre paterno materno cargo',
                        }
                    ]
                }),
            BandejaEntrada.count({ receptor: id_cuenta })
        ])
        SuccessResponse(res, { tramites, total })
    } catch (error) {
        ErrorResponse(res, error)
    }
}

const obtener_bandeja_salida = async (req = request, res = response) => {
    let { offset, limit } = req.query
    offset = offset ? offset : 0
    limit = limit ? limit : 10
    offset = offset * limit
    try {
        const [tramites, total] = await Promise.all([
            BandejaSalida.find({ 'emisor.cuenta': req.id_cuenta })
                .sort({ _id: -1 })
                .skip(offset)
                .limit(limit)
                .populate({
                    path: 'tramite',
                    select: 'alterno estado',
                    populate: {
                        path: 'tipo_tramite',
                        select: 'nombre -_id'
                    }
                })
                .populate({
                    path: 'receptor.cuenta',
                    select: '_id',
                    populate: [
                        {
                            path: 'dependencia',
                            select: 'nombre -_id',
                            populate: {
                                path: 'institucion',
                                select: 'sigla -_id'
                            }
                        }
                    ]
                }),
            BandejaSalida.count({ 'emisor.cuenta': req.id_cuenta })
        ])
        res.json({
            ok: true,
            tramites,
            total
        })
    } catch (error) {
        return ErrorResponse(res, err)
    }
}




const getUsers = async (req = request, res = response) => {
    const text = req.params.text
    const regex = new RegExp(text, 'i')
    try {
        const cuentas = await Cuenta.aggregate([
            {
                $lookup: {
                    from: "funcionarios",
                    localField: "funcionario",
                    foreignField: "_id",
                    as: "funcionario"
                }
            },
            {
                $unwind: {
                    path: "$funcionario"
                }
            },
            {
                $project: {
                    "funcionario.nombre": 1,
                    "funcionario.paterno": 1,
                    "funcionario.materno": 1,
                    "funcionario.cargo": 1,
                    _id: 1,
                    activo: 1

                }
            },
            {
                $addFields: {
                    "funcionario.fullname": {
                        $concat: ["$funcionario.nombre", " ", { $ifNull: ["$funcionario.paterno", ""] }, " ", { $ifNull: ["$funcionario.materno", ""] }]
                    }
                },
            },
            {
                $match: {
                    $or: [
                        { "funcionario.fullname": regex },
                        { "funcionario.cargo": regex },
                    ],
                    activo: true,
                    _id: { $ne: mongoose.Types.ObjectId(req.id_cuenta) }
                }
            },
            {
                $project: {
                    activo: 0
                }
            },
            { $limit: 4 },

        ])
        console.log(cuentas)
        return res.json({
            ok: true,
            cuentas
        })

    } catch (error) {
        return ErrorResponse(res, error)
    }
}


const aceptar_tramite = async (req = request, res = response) => {
    const id_bandeja = req.params.id
    try {
        const mail = await BandejaEntrada.findByIdAndUpdate(id_bandeja, { recibido: true })
        await BandejaSalida.findOneAndUpdate({ tramite: mail.tramite, 'emisor.cuenta': mail.emisor, 'receptor.cuenta': mail.receptor, recibido: null }, { recibido: true, fecha_recibido: new Date() })
        switch (mail.tipo) {
            case 'tramites_internos':
                await TramiteInterno.findByIdAndUpdate(mail.tramite, { estado: 'EN REVISION' })
                break;
            case 'tramites_externos':
                await TramiteExterno.findByIdAndUpdate(mail.tramite, { estado: 'EN REVISION' })
                break;
        }
        res.json({
            ok: true,
            message: 'Tramite aceptado'
        })
    } catch (error) {
        console.log('[SERVER]: error (aceptar tramite)', error);
        res.status(500).json({
            ok: true,
            message: 'No se ha podido aceptar el tramite'
        })
    }
}

const rechazar_tramite = async (req = request, res = response) => {
    const { motivo_rechazo } = req.body
    const id_bandeja = req.params.id
    try {
        const mail = await BandejaEntrada.findById(id_bandeja)
        // BUSCAR ULTIMO ENVIO PARA DEVOLVER A SU BANDEJA DE ENTRADA
        const ultimo_envio = await BandejaSalida.findOne({ tramite: mail.tramite, 'receptor.cuenta': mail.emisor, recibido: true }).sort({ _id: -1 })
        if (ultimo_envio) {
            // si existe debe regresar a ese envio
            await BandejaEntrada.findByIdAndUpdate(id_bandeja, { emisor: ultimo_envio.emisor.cuenta, receptor: ultimo_envio.receptor.cuenta, recibido: true, motivo: ultimo_envio.motivo, cantidad: ultimo_envio.cantidad, fecha_envio: ultimo_envio.fecha_envio })
        }
        else {
            // si no existe debe eliminarse de bandeja entrada
            await BandejaEntrada.findByIdAndDelete(id_bandeja)
        }
        await BandejaSalida.findOneAndUpdate({ tramite: mail.tramite, 'emisor.cuenta': mail.emisor, 'receptor.cuenta': mail.receptor, recibido: null }, { fecha_recibido: new Date(), motivo_rechazo, recibido: false })
        switch (mail.tipo) {
            case 'tramites_externos':
                await TramiteExterno.findByIdAndUpdate(mail.tramite, { ubicacion: mail.emisor })
                break;
            case 'tramites_internos':
                await TramiteInterno.findByIdAndUpdate(mail.tramite, { ubicacion: mail.emisor })
                break;
        }
        res.json({
            ok: true,
            message: 'Tramite rechazado'
        })
    } catch (error) {
        console.log('[SERVER]: error (rechazar tramite)', error);
        res.status(500).json({
            ok: true,
            message: 'No se ha podido rechazar el tramite'
        })
    }
}


const getDetailsMail = async (req = request, res = response) => {
    const id_bandeja = req.params.id
    try {
        const mail = await BandejaEntrada.findById(id_bandeja).select('cantidad fecha_envio motivo recibido tramite')
            .populate({
                path: 'emisor',
                select: '_id',
                populate: [
                    {
                        path: 'funcionario',
                        select: 'nombre paterno materno cargo -_id'
                    },
                    {
                        path: 'dependencia',
                        select: 'nombre -_id',
                        populate: {
                            path: 'institucion',
                            select: 'sigla -_id'
                        }
                    },
                ]
            })
        res.json({
            ok: true,
            mail
        })
    } catch (error) {
        console.log('[SERVER]: error (aceptar tramite)', error);
        res.status(500).json({
            ok: true,
            message: 'No se ha podido aceptar el tramite'
        })
    }
}


const searchInMails = async (req = request, res = response) => {
    const text = req.params.text
    let { type, limit, offset } = req.query
    const regex = new RegExp(text, 'i')
    offset = offset * limit
    try {
        let mails, total
        if (type === 'externo') {
            const ids_tramites = await TramiteExterno.find({ alterno: regex, ubicacion: req.id_cuenta }).skip(offset).limit(limit).select('_id')
            mails = await BandejaEntrada.find({ receptor: req.id_cuenta, "tramite": { "$in": ids_tramites } })
            total = await BandejaEntrada.count({ receptor: req.id_cuenta, "tramite": { "$in": ids_tramites } })
        }
        else {
            const ids_tramites = await TramiteInterno.find({ alterno: regex, ubicacion: req.id_cuenta }).skip(offset).limit(limit).select('_id')
            mails = await BandejaEntrada.find({ receptor: req.id_cuenta, "tramite": { "$in": ids_tramites } })
            total = await BandejaEntrada.count({ receptor: req.id_cuenta, "tramite": { "$in": ids_tramites } })
        }
        await BandejaEntrada.populate(mails, {
            path: 'tramite',
            select: 'alterno estado detalle',
            populate: {
                path: 'tipo_tramite',
                select: 'nombre -_id'
            }
        })
        await BandejaEntrada.populate(mails, {
            path: 'emisor',
            select: '_id',
            populate: [
                {
                    path: 'dependencia',
                    select: 'nombre -_id',
                    populate: {
                        path: 'institucion',
                        select: 'sigla -_id'
                    }
                },
                {
                    path: 'funcionario',
                    select: 'nombre paterno materno cargo',
                }
            ]
        })
        return res.json({
            ok: true,
            mails,
            total
        })
    } catch (error) {
        ErrorResponse(res, error)
    }
}

const searchInMailsExterno = async (req = request, res = response) => {
    const text = req.params.text
    let { type, limit, offset } = req.query
    const regex = new RegExp(text, 'i')
    offset = offset * limit
    try {
        let tramites, total
        if (type === 'alterno') {
            const ids_tramites = TramiteExterno.find({ alterno: regex, cuenta: req.id_cuenta }).skip(offset).limit(limit)
            tramites = await BandejaEntrada.find({ "tramite": { "$in": ids_tramites } }).skip(offset).limit(limit)

            total = await BandejaEntrada.count({ alterno: regex, cuenta: req.id_cuenta })
        }
        await BandejaEntrada.populate(tramites, {
            path: 'tramite',
            select: 'alterno estado detalle',
            populate: {
                path: 'tipo_tramite',
                select: 'nombre -_id'
            }
        })
        await BandejaEntrada.populate(tramites, {
            path: 'emisor',
            select: '_id',
            populate: [
                {
                    path: 'dependencia',
                    select: 'nombre -_id',
                    populate: {
                        path: 'institucion',
                        select: 'sigla -_id'
                    }
                },
                {
                    path: 'funcionario',
                    select: 'nombre paterno materno cargo',
                }
            ]
        })
        return res.json({
            ok: true,
            mails,
            total
        })
    } catch (error) {
        ErrorResponse(res, error)
    }
}






module.exports = {
    addMail,
    getMailsIn,
    obtener_bandeja_salida,
    aceptar_tramite,
    rechazar_tramite,

    getDetailsMail,

    getUsers,

    searchInMails,
    searchInMailsExterno
}