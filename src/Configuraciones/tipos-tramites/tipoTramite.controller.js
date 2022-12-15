const { request, response } = require("express");
const TipoTramite = require("./tipoTramite.model");
const agregar_TipoTramite = async (req = request, res = response) => {
  try {
    const value = new TipoTramite(req.body);
    const tipoTramite = await value.save();
    res.json({
      ok: true,
      tipoTramite,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "Error al registrar tipo tramite",
    });
  }
};
const editar_TipoTramite = async (req = request, res = response) => {
  try {
    const id_tipoTramite = req.params.id
    const tipoTramite = await TipoTramite.findByIdAndUpdate(id_tipoTramite, req.body, { new: true })
    res.json({
      ok: true,
      tipoTramite
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "Error al editar tipo de tramite",
    });
  }
};
const obtener_TiposTramites = async (req = request, res = response) => {
  let { pageIndex, rows } = req.query
  pageIndex = parseInt(pageIndex) || 0
  rows = parseInt(rows) || 10
  pageIndex = rows * pageIndex
  try {
    const [tiposTramites, total] = await Promise.all(
      [
        TipoTramite.find({}).sort({ _id: -1 }).skip(pageIndex).limit(rows),
        TipoTramite.count()
      ]
    )
    res.json({
      ok: true,
      tiposTramites,
      total
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "Error al obtener tipos de tramite",
    });
  }
};

const buscar_TiposTramites = async (req = request, res = response) => {
  let { pageIndex, rows } = req.query
  pageIndex = parseInt(pageIndex) || 0
  rows = parseInt(rows) || 10
  pageIndex = rows * pageIndex
  const termino = req.params.termino
  try {
    const regex = new RegExp(termino, 'i')
    const [tiposTramites, total] = await Promise.all(
      [
        TipoTramite.find({ $or: [{ nombre: regex }, { segmento: regex }] }).skip(pageIndex).limit(rows),
        TipoTramite.find({ $or: [{ nombre: regex }, { segmento: regex }] }).count()
      ]
    )
    res.json({
      ok: true,
      tiposTramites:tiposTramites,
      total
    })
  } catch (error) {
    console.log('[Server]: Error (buscar tipo de tramite) =>', error);
    res.status(400).send({
      ok: false,
      message: 'Error al buscar tipo de tramite'
    })
  }
};


const editar_requerimientos = async (req = request, res = response) => {
  // recibe id del tipo de tramite y id de requisito
  const { tipo, requisito } = req.params
  let cambiosRequerimiento = {}
  // crear campos a actualizar en array requerimientos
  for (const [key, value] of Object.entries(req.body)) {
    cambiosRequerimiento[`requerimientos.$.${key}`] = value
  }
  try {
    await TipoTramite.updateOne({ "_id": tipo, "requerimientos._id": requisito }, {
      $set: cambiosRequerimiento
    })
    res.json({
      ok: true,
      message: 'Requerimiento actualizado'
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "Error al actualizar requerimiento",
    });
  }
}


module.exports = {
  agregar_TipoTramite,
  editar_TipoTramite,
  obtener_TiposTramites,
  buscar_TiposTramites,

  editar_requerimientos
};
