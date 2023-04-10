const jwt = require("jsonwebtoken");
require('dotenv').config()

const CuentaModel = require("../src/Configuraciones/models/cuentas.model");
const verifyToken = async (req, res, next) => {
    try {
        const token = req.header("token");
        if (!token) return res.status(401).json({ ok: false, message: 'No token provided' })
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const account = await CuentaModel.findById(decoded.id_cuenta).select("funcionario activo rol dependencia");
        if (!account) return res.status(401).json({ ok: false, message: "Account dont exist" });
        if (account._id != process.env.ID_ROOT) {
            if (!account.activo) {
                return res.status(401).json({
                    ok: false,
                    message: "Account is disabled",
                });
            }
            if (!account.funcionario) {
                return res.status(401).json({
                    ok: false,
                    message: "Account is unlink",
                });
            }
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

module.exports = verifyToken
