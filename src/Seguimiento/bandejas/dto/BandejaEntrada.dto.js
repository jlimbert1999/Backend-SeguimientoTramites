// const { checkSchema, validationResult } = require('express-validator');
// const { response } = require('express')





// const validateBandejaEntradaDto = (req, res = response, next) => {
    

//     const errores = validationResult(req)
//     if (!errores.isEmpty()) {
//         return res.status(400).send({
//             ok: false,
//             message: 'Parametros incorrectos o faltantes',

//             errors: errores.array()
//         })
//     }
//     next()
// }
// module.exports = validateBandejaEntradaDto