const jwt = require('jsonwebtoken')
const generarToken = (id_cuenta, id_funcionario, funcionario, cargo, rol, dependencia, institucion, codigo) => {

    return new Promise((resolve, reject) => {
        const payload = {
            id_cuenta,
            id_funcionario,
            funcionario,
            cargo,
            rol,
            dependencia,
            institucion,
            codigo
        }
        jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '8h'
        }, (err, token) => {
            if (err) {
                console.log('[SERVER]: error (generar token) => ', err);
                return reject({ code: 500, message: 'Error interno, intente de nuevo' })
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