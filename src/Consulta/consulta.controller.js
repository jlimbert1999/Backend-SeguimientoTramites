
const { TramiteExterno } = require('../Seguimiento/tramites/tramite.model')
const BandejaSalida = require('../Seguimiento/bandejas/bandeja-salida.model')
const { request, response } = require('express')
const consultar = async (req = request, resp = response) => {
    let { dni, pin } = req.query
    if (!dni || !pin) {
        return resp.status(400).json({
            ok: false,
            message: 'Se necesita el pin y dni para realizar la consultar'
        })
    }
    try {
        const tramite = await TramiteExterno.aggregate([
            {
                $lookup: {
                    from: "solicitantes",
                    localField: "solicitante",
                    foreignField: "_id",
                    as: "solicitantes"
                }
            },
            {
                $unwind: {
                    path: "$solicitantes"
                }
            },
            {
                $match: {
                    $and: [{ "solicitantes.dni": dni }, { "pin": parseInt(pin) }]
                }
            },
            { $limit: 1 },
            {
                $project: {
                    alterno: 1,
                    pin: 1,
                    cite: 1,
                    cantidad: 1,
                    detalle: 1,
                    fecha_registro: 1,
                    ubicacion: 1,
                    cuenta: 1,
                    estado: 1,
                    observaciones: 1,
                    tipo_tramite: 1,
                    requerimientos: 1,
                    'solicitantes.nombre': 1,
                    'solicitantes.tipo': 1,
                    'solicitantes.telefono': 1,
                    'solicitantes.expedido': 1,
                    'solicitantes.documento': 1,
                }
            }
        ])
        if (tramite.length === 0) {
            return resp.status(404).json({
                ok: true,
                message: 'No se econtro ningun tramite, revise el pin / numero de documento'
            })
        }
        await TramiteExterno.populate(tramite,
            [
                {
                    path: "cuenta",
                    select: '_id',
                    populate: {
                        path: 'funcionario',
                        select: 'nombre cargo -_id'
                    }
                },
                {
                    path: "ubicacion",
                    select: '_id',
                    populate: [
                        {
                            path: 'funcionario',
                            select: 'nombre cargo -_id'
                        },
                        {
                            path: 'dependencia',
                            select: 'nombre -_id',
                            populate: {
                                path: 'institucion',
                                select: 'sigla'
                            }
                        },
                    ]

                },
                {
                    path: "tipo_tramite",
                    select: 'nombre'
                }
            ]
        );
        const workflow = await BandejaSalida.find({ tramite: tramite[0]._id }).select('-_id -__v')
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
        return resp.json({
            ok: true,
            tramite: tramite[0],
            workflow
        })
    } catch (error) {
        console.log('[SERVER]: Error consulta =>', error)
        return resp.status(500).json({
            ok: false,
            message: 'No se puede consultar'
        })
    }
}
module.exports = {
    consultar
}