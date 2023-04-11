const jwt = require('jsonwebtoken')

exports.createRootToken = (cuenta) => {
    return jwt.sign({
        id_cuenta: cuenta._id,
        funcionario: {
            nombre: 'ADMINISTRADOR',
            paterno: '',
            materno: '',
            cargo: 'CONFIGURACIONES'
        },
        codigo: '',
        resources: cuenta.rol.privileges.map(privilege => privilege.resource)
    }, process.env.JWT_SECRET, {
        expiresIn: '8h'
    })
}

exports.createToken = (cuenta) => {
    return jwt.sign({
        id_cuenta: cuenta._id,
        funcionario: cuenta.funcionario,
        codigo: cuenta.dependencia.codigo,
        resources: cuenta.rol.privileges.map(privilege => privilege.resource)
    }, process.env.JWT_SECRET, {
        expiresIn: '8h'
    })
}
