const { request, response } = require('express')
const { TramiteExterno, Solicitante } = require('../../Seguimiento/externos/externo.model')
const BandejaSalida = require('../../Seguimiento/bandejas/bandeja-salida.model')
const Cuentas = require('../../Configuraciones/cuentas/cuenta.model')
const ObjectId = require('mongoose').Types.ObjectId
const TypesTramites = require('../../Configuraciones/tipos-tramites/tipoTramite.model')

const GetReporteFicha = async (req = request, resp = response) => {
    const alterno = req.params.alterno
    try {
        const tramite = await TramiteExterno.findOne({ alterno: alterno })
            .select('estado alterno pin detalle cantidad fecha_registro cite')
            .populate('solicitante')
            .populate('representante')
            .populate('tipo_tramite', 'nombre -_id')
            .populate({
                path: 'ubicacion',
                select: '_id',
                populate: [
                    {
                        path: 'dependencia',
                        select: 'nombre -_id',
                        populate: {
                            path: 'institucion',
                            select: 'sigla'
                        }
                    },
                    {
                        path: 'funcionario',
                        select: 'nombre paterno materno cargo'
                    }
                ]
            })

        if (!tramite) {
            return resp.status(404).json({
                ok: true,
                message: `No se encontro ningun tramite con el alterno: ${alterno}`
            })
        }
        const workflow = await BandejaSalida.find({ tramite: tramite._id, recibido: true })
            .select('fecha_envio fecha_recibido fecha_envio')
            .populate({
                path: 'emisor.cuenta',
                select: '_id',
                populate: {
                    path: 'dependencia',
                    select: 'nombre -_id',
                    populate: {
                        path: 'institucion',
                        select: 'sigla -_id'
                    }
                }
            })
            .populate({
                path: 'receptor.cuenta',
                select: '_id',
                populate: {
                    path: 'dependencia',
                    select: 'nombre -_id',
                    populate: {
                        path: 'institucion',
                        select: 'sigla -_id'
                    }

                }
            })
        return resp.json({
            ok: true,
            tramite,
            workflow
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener data para reporte ficha)', error)
        return resp.status(500).json({
            ok: false,
            message: 'Error al generar reporte ficha'
        })

    }
}
const GetReporteRuta = async (req = request, resp = response) => {
    const alterno = req.params.alterno
    try {
        const tramite = await TramiteExterno.findOne({ alterno: alterno })
            .select('estado alterno pin detalle cantidad fecha_registro cite')
            .populate('solicitante')
            .populate('representante')
            .populate('tipo_tramite', 'nombre -_id')
            .populate({
                path: 'ubicacion',
                select: '_id',
                populate: [
                    {
                        path: 'dependencia',
                        select: 'nombre -_id',
                        populate: {
                            path: 'institucion',
                            select: 'sigla'
                        }
                    },
                    {
                        path: 'funcionario',
                        select: 'nombre paterno materno cargo'
                    }
                ]
            })
        if (!tramite) {
            return resp.status(404).json({
                ok: true,
                message: `No se encontro ningun tramite con el alterno: ${alterno}`
            })
        }
        const workflow = await BandejaSalida.find({ tramite: tramite._id, recibido: true })
            .populate({
                path: 'emisor.cuenta',
                select: 'login -_id',
                populate: {
                    path: 'dependencia',
                    select: 'nombre -_id',
                    populate: {
                        path: 'institucion',
                        select: 'sigla -_id'
                    }
                }
            })
            .populate({
                path: 'receptor.cuenta',
                select: 'login -_id',
                populate: {
                    path: 'dependencia',
                    select: 'nombre -_id',
                    populate: {
                        path: 'institucion',
                        select: 'sigla -_id'
                    }

                }
            })
        return resp.json({
            ok: true,
            tramite,
            workflow
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener data para reporte ficha)', error)
        return resp.status(500).json({
            ok: false,
            message: 'Error al generar reporte ficha'
        })

    }
}
const GertReporteEstado = async (req = request, resp = response) => {
    const estado = req.params.estado
    const { fecha_inicial, fecha_final, institucion } = req.query
    try {
        if (!fecha_inicial || !fecha_final || !institucion) {
            return resp.status(404).json({
                ok: false,
                message: 'Debe seleccionar el intervalo de fechas y la institucion para generar el reporte'
            })
        }
        const ids_cuentas = await Cuentas.aggregate([
            {
                $lookup: {
                    from: "dependencias",
                    localField: "dependencia",
                    foreignField: "_id",
                    as: "dependencias"
                }
            },
            {
                $unwind: {
                    path: "$dependencias"
                }
            },
            {
                $match: {
                    "dependencias.institucion": ObjectId(institucion)
                }
            },
            { $project: { _id: 1, login: 1 } }
        ])
        tramites = await TramiteExterno.find({
            estado, fecha_registro: {
                $gt: fecha_inicial,
                $lt: fecha_final
            }, cuenta: {
                $in: ids_cuentas
            }
        }).select('alterno fecha_registro detalle')
            .populate({
                path: 'cuenta',
                select: 'login -_id',
                populate: {
                    path: 'funcionario',
                    select: 'nombre cargo'
                }
            })
            .populate('solicitante', 'nombre -_id')
            .populate({
                path: 'ubicacion',
                select: '_id',
                populate: {
                    path: 'dependencia',
                    select: 'nombre -_id',
                    populate: {
                        path: 'institucion',
                        select: 'sigla'
                    }
                }
            })
        if (tramites.length === 0) {
            return resp.status(404).json({
                ok: true,
                message: `No se econtraron tramites con el estado "${estado}"`
            })
        }
        return resp.json({
            ok: true,
            tramites
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener data para reporte estados)', error)
        return resp.status(500).json({
            ok: false,
            message: 'Error al generar reporte estado'
        })
    }
}
const GetReporteSolicitante = async (req = request, resp = response) => {
    const termino = req.params.termino
    try {
        const regex = new RegExp(termino, 'i')
        const solicitantes = await Solicitante.find({ $or: [{ nombre: regex }, { dni: regex }] }).select('_id')
        if (solicitantes.length == 0) {
            return resp.status(404).json({
                ok: true,
                message: 'No existe ningun solicitante con el DNI o Nombre introducidos'
            })
        }
        const tramites = await TramiteExterno.find({ solicitante: { $in: solicitantes } })
            .populate('tipo_tramite', 'nombre -_id')
            .populate('solicitante')
            .populate('representante')
            .populate({
                path: 'ubicacion',
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
                        select: 'nombre cargo -_id'
                    }
                ]
            })
        return resp.json({
            ok: true,
            tramites
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener data para reporte solicitantes)', error)
        return resp.status(500).json({
            ok: false,
            message: 'Error al generar reporte solicitante'
        })
    }
}
const GetReporteContribuyente = async (req = request, resp = response) => {
    const dni = req.params.dni
    try {
        let tramites = await TramiteExterno.aggregate([
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
                    "solicitantes.dni": dni
                }
            },
            { $project: { _id: 0, detalle: 1, alterno: 1, estado: 1, cuenta: 1, fecha_registro: 1, ubicacion: 1, "solicitantes.nombre": 1, "solicitantes.telefono": 1, "solicitantes.dni": 1, "solicitantes.expedido": 1 } }
        ])
        if (tramites.length === 0) {
            return resp.status(404).json({
                ok: true,
                message: `No se econtraron resultados con el DNI: ${dni}`
            })
        }
        await TramiteExterno.populate(tramites,
            {
                path: "cuenta",
                select: 'login -_id',
                populate: {
                    path: 'funcionario',
                    select: 'nombre -_id'
                }
            })
        await TramiteExterno.populate(tramites, {
            path: 'ubicacion',
            select: '_id',
            populate: [
                {
                    path: 'dependencia',
                    select: 'nombre -_id',
                    populate: {
                        path: 'institucion',
                        select: 'sigla'
                    }
                },
                {
                    path: 'funcionario',
                    select: 'nombre cargo'
                }
            ]
        })
        return resp.json({
            ok: true,
            tramites
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener data para reporte contribuyente)', error)
        return resp.status(500).json({
            ok: false,
            message: 'Error al generar reporte contribuyente'
        })
    }
}
const GetReporteTipoTramite = async (req = request, resp = response) => {
    const institucion = req.params.institucion
    const { tipo_tramite, fecha_inicial, fecha_final } = req.query
    try {
        const ids_cuentas = await Cuentas.aggregate([
            {
                $lookup: {
                    from: "dependencias",
                    localField: "dependencia",
                    foreignField: "_id",
                    as: "dependencias"
                }
            },
            {
                $unwind: {
                    path: "$dependencias"
                }
            },
            {
                $match: {
                    "dependencias.institucion": ObjectId(institucion)
                }
            },
            { $project: { _id: 1 } }
        ])
        tramites = await TramiteExterno.find({
            tipo_tramite, fecha_registro: {
                $gt: fecha_inicial,
                $lt: fecha_final
            }, cuenta: {
                $in: ids_cuentas
            }
        }).select('alterno fecha_registro detalle estado')
            .populate({
                path: 'cuenta',
                select: 'login -_id',
                populate: {
                    path: 'funcionario',
                    select: 'nombre cargo'
                }
            })
            .populate('solicitante', 'nombre -_id')
            .populate({
                path: 'ubicacion',
                select: '_id',
                populate: [
                    {
                        path: 'dependencia',
                        select: 'nombre -_id',
                        populate: {
                            path: 'institucion',
                            select: 'sigla'
                        }
                    },
                    {
                        path: 'funcionario',
                        select: 'nombre cargo'
                    }
                ]
            })

        if (tramites.length === 0) {
            return resp.status(404).json({
                ok: true,
                message: `No se econtraron tipos de tramites con los parametros solicitados`
            })
        }
        // console.log(tramites)
        return resp.json({
            ok: true,
            tramites
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener data reporte tipo de tramite)', error)
        return resp.status(500).json({
            ok: false,
            message: 'Error al generar reporte tipo de tramite'
        })
    }
}




const GetTypesTramites = async (req = request, resp = response) => {
    try {
        const tipos = await TypesTramites.find({ activo: true }).select('nombre')
        return resp.json({
            ok: true,
            tipos
        })
    } catch (error) {
        console.log('[SERVER]: error (obtener data para reporte ficha)', error)
        return resp.status(500).json({
            ok: false,
            message: 'Error al generar reporte ficha'
        })

    }
}

module.exports = {
    GetReporteFicha,
    GertReporteEstado,
    GetReporteRuta,
    GetReporteSolicitante,
    GetReporteContribuyente,
    GetReporteTipoTramite,

    GetTypesTramites
}
