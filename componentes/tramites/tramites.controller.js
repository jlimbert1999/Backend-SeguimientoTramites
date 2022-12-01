const { request, response } = require('express')
const Tramites=require('./tramites.model')
const agregar_TipoTramite= async (req = request, res = response) => {
    
    try {
      
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: 'Error al registrar cuenta'
        })

    }
}
const editar_TipoTramite= async (req = request, res = response) => {
    
    try {
      
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: 'Error al registrar cuenta'
        })

    }
}
const obtener_TiposTramites= async (req = request, res = response) => {
    
    try {
      
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: 'Error al registrar cuenta'
        })

    }
}

module.exports={
    agregar_TipoTramite,
    editar_TipoTramite,
    obtener_TiposTramites
   
}