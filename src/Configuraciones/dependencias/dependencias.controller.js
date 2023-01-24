const { request, response } = require("express");
const Dependendencia = require("./dependencias.model");
const Institucion = require("../instituciones/instituciones.model");

const getInstituciones = async (req = request, res = response) => {
  try {
    const instituciones = await Institucion.find({ activo: true }, "nombre sigla");
    res.json({
      ok: true,
      instituciones,
    });
  } catch (error) {
    console.log(
      "[SERVER]: error (obtener institucions para dependencias)",
      error
    );
    res.json({
      ok: false,
      message: "Error al obtener instituciones",
    });
  }
};
const obtener_dependencias = async (req = request, res = response) => {
  let { pageIndex, rows } = req.query;
  pageIndex = parseInt(pageIndex) || 0;
  rows = parseInt(rows) || 10;
  pageIndex = pageIndex * rows
  try {
    let [dependencias, total] = await Promise.all([
      Dependendencia.find({}).sort({ _id: -1 })
        .populate("institucion", "sigla")
        .skip(pageIndex)
        .limit(rows),
      Dependendencia.count(),
    ]);
    res.json({
      ok: true,
      dependencias,
      total,
    });
  } catch (error) {
    console.log(error);
    res.json({
      ok: false,
      message: "Error al obtener al dependencia",
    });
  }
};

const agregar_dependencia = async (req = request, res = response) => {
  const { sigla, codigo } = req.body;
  try {
    const existeSigla = await Dependendencia.findOne(
      { $or: [{ sigla }, { codigo }] }
    );
    if (existeSigla) {
      return res.status(400).json({
        ok: false,
        message: "El codigo o sigla de la dependencia ya existen",
      });
    }
    const newDependencia = new Dependendencia(req.body);
    const dependencia = await newDependencia.save();
    res.json({
      ok: true,
      dependencia,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "Error al registrar al dependencia",
    });
  }
};
const editar_dependencia = async (req = request, res = response) => {
  const { sigla, codigo } = req.body;
  const id_dependencia = req.params.id;
  try {
    const dependenciadb = await Dependendencia.findById(id_dependencia);
    if (!dependenciadb) {
      return res.status(400).json({
        ok: false,
        message: "El id de la instittuion no existe",
      });
    }
    if (dependenciadb.sigla !== sigla) {
      const existeSigla = await Dependendencia.findOne({ sigla });
      if (existeSigla) {
        return res.status(400).json({
          ok: false,
          message: "La sigla de la institucion ya existe",
        });
      }
    }
    if (dependenciadb.codigo !== codigo) {
      const existeCodigo = await Dependendencia.findOne({ codigo });
      if (existeCodigo) {
        return res.status(400).json({
          ok: false,
          message: "El codigo de la dependencia ya existe",
        });
      }
    }
    const dependencia = await Dependendencia.findByIdAndUpdate(
      id_dependencia,
      req.body,
      { new: true }
    ).populate("institucion", "sigla");
    res.json({
      ok: true,
      dependencia,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "Error al actualizar la dependencia",
    });
  }
};
const cambiar_situacion_dependencia = async (req = request, res = response) => {
  const id_dependencia = req.params.id;
  const { activo } = req.body;
  try {
    await Dependendencia.findByIdAndUpdate(id_dependencia, { activo });
    res.json({
      ok: true,
      message: "se actualizo la situacion de la dependencia",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "Error al cambiar situacion de dependencia",
    });
  }
};
const buscar_dependencia = async (req = request, res = response) => {
  const termino = req.params.termino
  let { pageIndex, rows } = req.query;
  pageIndex = parseInt(pageIndex) || 0;
  rows = parseInt(rows) || 10;
  pageIndex = pageIndex * rows
  try {
    const regex = new RegExp(termino, 'i')
    let [dependencias, total] = await Promise.all([
      Dependendencia.find(
        {
          $or: [{ nombre: regex }, { sigla: regex }]
        }).populate("institucion", "sigla")
        .skip(pageIndex)
        .limit(rows),
      Dependendencia.find(
        {
          $or: [{ nombre: regex }, { sigla: regex }]
        }
      ).count(),
    ])
    res.json({
      ok: true,
      dependencias,
      total
    });
  } catch (error) {
    console.log(error);
    res.json({
      ok: false,
      message: "Error al buscar al dependencia",
    });
  }
};

module.exports = {
  agregar_dependencia,
  editar_dependencia,
  obtener_dependencias,
  cambiar_situacion_dependencia,
  buscar_dependencia,

  getInstituciones,
};
