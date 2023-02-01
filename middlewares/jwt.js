const jwt = require('jsonwebtoken')

const verificarToken = (req, res, next) => {
    let token = req.header('token')
    if (!token) {
        return res.status(401).json({
            ok: false,
            message: 'Debe iniciar sesion'
        })
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log(`[SERVER]: error (validar token) => ${err}`);
            return res.status(401).json({
                ok: false,
                message: 'Sesion no valida o caducada, vuelva a iniciar sesion'
            })
        }
        req.id_cuenta = decoded.id_cuenta;
        req.rol = decoded.rol
        next()
    })
}
const verificarAdminRol = (req, res, next) => {
    if (req.rol !== "admin") {
        return res.status(403).json({
            of: false,
            message: "No tiene autorizacion para la ruta ingresada"
        })
    }
    next()
}

const verificarRecepcionRol = (req, res, next) => {
    if (req.rol !== "RECEPCION") {
        return res.status(403).json({
            of: false,
            message: "No tiene autorizacion para la ruta ingresada"
        })
    }
    next()
}
module.exports = {
    verificarToken,
    verificarAdminRol,
    verificarRecepcionRol
}