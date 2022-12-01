const {validationResult} = require('express-validator');
const {response}=require('express')

const validarBody=(req, res=response, next)=>{
    const errores=validationResult(req)
    if(!errores.isEmpty()){
        return res.status(400).send({
            ok:false,
            message:'Faltan parametros',
            errors:errores.mapped()
        })
    }
    next()
}
module.exports=validarBody