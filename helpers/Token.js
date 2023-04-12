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
        citeCode: '',
        institutionCode: '',
        resources: cuenta.rol.privileges.map(privilege => privilege.resource)
    }, process.env.JWT_SECRET, {
        expiresIn: '8h'
    })
}

exports.createToken = (cuenta) => {
    return jwt.sign({
        id_cuenta: cuenta._id,
        funcionario: cuenta.funcionario,
        citeCode: cuenta.dependencia.codigo,
        institutionCode: cuenta.dependencia.institucion.sigla,
        resources: cuenta.rol.privileges.map(privilege => privilege.resource)
    }, process.env.JWT_SECRET, {
        expiresIn: '8h'
    })
}
