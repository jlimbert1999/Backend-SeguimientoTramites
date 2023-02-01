const jwt = require('jsonwebtoken')

const generarToken = (cuenta) => {
    return new Promise((resolve, reject) => {
        let payload
        if (cuenta.rol == 'admin') {
            payload = {
                id_cuenta: cuenta._id,
                funcionario: {
                    nombre_completo: 'Administrador',
                    cargo: "Configuraciones"
                },
                rol: cuenta.rol
            }
        }
        else {
            payload = {
                id_cuenta: cuenta._id,
                funcionario: {
                    nombre_completo: `${cuenta.funcionario.nombre} ${cuenta.funcionario.paterno} ${cuenta.funcionario.materno ? cuenta.funcionario.materno : ''}`,
                    cargo: cuenta.funcionario.cargo
                },
                rol: cuenta.rol,
                codigo: cuenta.dependencia.institucion.sigla,
                cite: cuenta.dependencia.codigo
            }
        }
        jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '8h'
        }, (err, token) => {
            if (err) {
                console.log('[SERVER]: error (generar token) => ', err);
                reject({ code: 500, message: 'Error interno, intente de nuevo' })
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