const jwt = require('jsonwebtoken')

const generarToken = (cuenta) => {
    return new Promise((resolve, reject) => {
        let payload
        if (cuenta.rol.includes('ADMINISTRADOR')) {
            payload = {
                id_cuenta: cuenta._id,
                funcionario: {
                    nombre_completo: 'ADMINISTRADOR',
                    cargo: "Configuraciones"
                },
                rol: cuenta.rol
            }
        }
        else {
            payload = {
                id_cuenta: cuenta._id,
                funcionario: {
                    nombre_completo: `${cuenta.funcionario.nombre} ${cuenta.funcionario.paterno} ${cuenta.funcionario.materno}`,
                    cargo: cuenta.funcionario.cargo
                },
                rol: cuenta.rol,
                cite: cuenta.dependencia.codigo
            }
        }
        jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '8h'
        }, (err, token) => {
            if (err) {
                reject({ status: 500, message: 'Error en el servidor login' })
            }
            else {
                resolve(token)
            }
        })
    })
}
module.exports = {
    generarToken
}