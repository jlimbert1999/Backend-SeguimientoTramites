const router = require('express').Router()
const { ServerErrorResponde } = require('../../helpers/responses')
const verifyToken = require('../../middlewares/verifyToken')
const archivoService = require('./services/archivo.service')


router.get('', verifyToken, async (req = request, res = response) => {
    try {
        const tramites = await archivoService.get(req.id_dependencia)
        return res.status(200).json({
            ok: true,
            tramites
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.put('/:id', verifyToken, async (req = request, res = response) => {
    try {
        let { descripcion } = req.body
        const message = await archivoService.unarchive(req.params.id, req.id_funcionario, descripcion)
        return res.status(200).json({
            ok: true,
            message
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

module.exports = router