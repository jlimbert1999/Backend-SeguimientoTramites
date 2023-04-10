const RolModel = require('../models/roles.model')

class RolService {
    async get() {
        const Roles = await RolModel.find({})
        return Roles
    }
    async add(Rol) {
        const newRol = new RolModel(Rol);
        const rolDB = await newRol.save();
        return rolDB
    }
    async edit(Rol, id) {
        const newRol = await RolModel.findByIdAndUpdate(id, Rol, { new: true });
        return newRol

    }

    async delete() {

    }


}
module.exports = RolService