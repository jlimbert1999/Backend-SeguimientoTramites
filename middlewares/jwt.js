const jwt = require("jsonwebtoken");
const CuentaModel = require("../src/Configuraciones/models/cuentas.model");

const verificarToken = async (req, res, next) => {
    try {
        let token = req.header("token");
        if (!token) {
            throw ({ status: 401, message: 'No token provided' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const account = await CuentaModel.findById(decoded.id_cuenta).select("funcionario activo rol dependencia");
        if (!account) return res.status(401).json({ ok: false, message: "Account dont exist" });
        if (!account.activo) {
            return res.status(401).json({
                ok: false,
                message: "Account is disabled",
            });
        }
        if (!account.funcionario && !account.rol.includes("ADMINISTRADOR")) {
            return res.status(401).json({
                ok: false,
                message: "Account is unlink",
            });
        }
        req.id_cuenta = account._id;
        req.id_funcionario = account.funcionario;
        req.rol = account.rol
        req.id_dependencia = account.dependencia
        next();
    } catch (error) {
        return res.status(401).json({
            ok: false,
            message: "Token invalid or expired",
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
