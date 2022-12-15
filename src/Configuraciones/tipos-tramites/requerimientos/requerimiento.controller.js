const { request, response } = require("express");
const Requerimiento = require("./requerimiento.model");
const agregar_requerimiento = async (req = request, res = response) => {
    try {
        const newRequerimiento = new Requerimiento(req.body);
        const requerimiento = await newRequerimiento.save();
        res.json({
            ok: true,
            requerimiento
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: "Error al registrar requerimiento tramite",
        });
    }
};
const editar_requerimiento = async (req = request, res = response) => {
    try {
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: "Error al registrar cuenta",
        });
    }
};
const obtener_requerimientos = async (req = request, res = response) => {
    try {
        const requerimientos = await Requerimiento.find({})
        res.json({
            ok: true,
            requerimientos,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener requerimientos tramite",
        });
    }
};

module.exports = {
    agregar_requerimiento,
    editar_requerimiento,
    obtener_requerimientos
};
