const jwt = require("jsonwebtoken");
const Cuentas = require("../src/Configuraciones/cuentas/cuenta.model");

const verificarToken = async (req, res, next) => {
    try {
        let token = req.header("token");
        if (!token) {
            throw "No token provided";
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const account = await Cuentas.findById(decoded.id_cuenta).select("funcionario activo rol");
        if (!account) return res.status(404).json({ ok: false, message: "La sesion no es valida. La cuenta no existe" });
        if (!account.activo || !account.funcionario && account.rol !== "admin") {
            return res.status(401).json({
                ok: false,
                message: "La cuenta ha sido deshabilitada",
            });
        }
        req.id_cuenta = decoded.id_cuenta;
        req.id_funcionario = account.funcionario;
        req.rol = account.rol
        req.id_dependencia = account.dependencia
        next();
    } catch (error) {
        return res.status(401).json({
            ok: false,
            message: "Acceso denegado, debe iniciar sesion",
        });
    }
};
const verificarAdminRol = (req, res, next) => {
    if (req.rol !== "admin") {
        return res.status(403).json({
            of: false,
            message: "No tiene autorizacion para la ruta ingresada",
        });
    }
    next();
};

const verificarRecepcionRol = (req, res, next) => {
    if (req.rol !== "RECEPCION") {
        return res.status(403).json({
            of: false,
            message: "No tiene autorizacion para la ruta ingresada",
        });
    }
    next();
};
module.exports = {
    verificarToken,
    verificarAdminRol,
    verificarRecepcionRol,
};
