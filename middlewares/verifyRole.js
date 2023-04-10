const RolModel = require('../src/Configuraciones/models/roles.model')
const verifyRole = (resource) => {
    return async (req, res, next) => {
        const role = await RolModel.findById(req.rol)
        if (!role) {
            return res.status(403).json({
                of: false,
                message: "Esta cuenta no tiene ningun permisos asignado",
            });
        }
        let allow = false;
        const privilege = role.privileges.find(element => element.resource === resource)
        if (!privilege) {
            return res.status(403).json({
                of: false,
                message: `Esta cuenta no tiene permisos para el recurso ${resource}`,
            });
        }
        if (req.method == "POST" && privilege.create) allow = true;
        else if (req.method == "GET" && privilege.read) allow = true;
        else if (req.method == "PUT" && privilege.update) allow = true;
        else if (req.method == "DELETE" && privilege.delete) allow = true;
        if (allow) next();
        else {
            return res.status(403).json({
                of: false,
                message: `Esta cuenta no cuenta con los permisos necesarios para realizar esta accion`,
            });
        }
    }
}


module.exports = verifyRole
