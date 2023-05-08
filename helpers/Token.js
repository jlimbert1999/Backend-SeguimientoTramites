const jwt = require('jsonwebtoken')

exports.createRootToken = (account) => {
    return jwt.sign({
        id_account: account._id,
        officer: {
            fullname: 'ADMINISTRADOR',
            jobtitle: 'CONFIGURACIONES'
        }
    }, process.env.JWT_SECRET, {
        expiresIn: '8h'
    })
}

exports.createToken = (account) => {
    return jwt.sign({
        id_account: account._id,
        id_dependencie: account.dependencia._id,
        officer: {
            id_officer: account.funcionario._id,
            fullname: `${account.funcionario.nombre} ${account.funcionario.paterno} ${account.funcionario.materno}`,
            jobtitle: account.funcionario.cargo
        }
    }, process.env.JWT_SECRET, {
        expiresIn: '8h'
    })
}
