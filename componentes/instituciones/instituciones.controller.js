const { request, response, json } = require('express')
const Institucion = require('./instituciones.model')
const agregar_institucion = async (req = request, res = response) => {
    const { sigla } = req.body
    try {
        const existeSigla = await Institucion.findOne({ sigla })
        if (existeSigla) {
            return res.status(400).json({
                ok: false,
                message: 'Ya existe una institucion con la sigla introducida'
            })
        }
        const newInstitucion = new Institucion(req.body)
        const institucionDB = await newInstitucion.save()
        res.json({
            ok: true,
            institucion: institucionDB
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: 'Error al registrar la institucion'
        })

    }
}
const editar_institucion = async (req = request, res = response) => {
    const { sigla } = req.body
    const id_institucion = req.params.id
    try {
        const instituciondb = await Institucion.findById(id_institucion)
        if (!instituciondb) {
            return res.status(400).json({
                ok: false,
                message: 'El id de la instittuion no existe'
            })

        }
        if (instituciondb.sigla !== sigla) {
            const existeSigla = await Institucion.findOne({ sigla })
            if (existeSigla) {
                return res.status(400).json({
                    ok: false,
                    message: 'Ya existe una institucion con la sigla introducida'
                })
            }
        }
        const institucion = await Institucion.findByIdAndUpdate(id_institucion, req.body, { new: true })
        res.json({
            ok: true,
            institucion
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: 'Error al actualizar la institucion'
        })

    }
}


const obtener_instituciones = async (req = request, res = response) => {
    let { pageIndex, rows } = req.query
    pageIndex = parseInt(pageIndex) || 0
    rows = parseInt(rows) || 10
    pageIndex = rows * pageIndex
    try {
        const [instituciones, total] = await Promise.all(
            [
                Institucion.find({}).sort({ _id: -1 }).skip(pageIndex).limit(rows),
                Institucion.count()
            ]
        )
        res.json({
            ok: true,
            instituciones,
            total
        })
    } catch (error) {
        console.log('[Server]: Error (obtener instituciones) =>', error);
        res.status(400).send({
            ok: false,
            message: 'Error al obtener las instituciones'
        })
    }
}
const buscar_instituciones = async (req = request, res = response) => {
    let { pageIndex, rows } = req.query
    pageIndex = parseInt(pageIndex) || 0
    rows = parseInt(rows) || 10
    pageIndex = rows * pageIndex
    const termino = req.params.termino
    try {
        const regex = new RegExp(termino, 'i')
        const [instituciones, total] = await Promise.all(
            [
                Institucion.find({ $or: [{ nombre: regex }, { sigla: regex }] }).skip(pageIndex).limit(rows),
                Institucion.find({ $or: [{ nombre: regex }, { sigla: regex }] }).count()
            ]
        )
        res.json({
            ok: true,
            instituciones,
            total
        })
    } catch (error) {
        console.log('[Server]: Error (buscar instituciones) =>', error);
        res.status(400).send({
            ok: false,
            message: 'Error al buscar las instituciones'
        })
    }
}


module.exports = {
    agregar_institucion,
    editar_institucion,
    obtener_instituciones,
    buscar_instituciones
}