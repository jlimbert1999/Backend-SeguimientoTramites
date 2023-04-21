const router = require('express').Router()
const { ServerErrorResponde } = require('../../helpers/responses')
const archivoService = require('./services/archivo.service')


router.get('/', async (req = request, res = response) => {
    try {
        const archives = await archivoService.get(req.id_cuenta)
        return res.status(200).json({
            ok: true,
            archives
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.put('/:id', async (req = request, res = response) => {
    try {
        let { description } = req.body
        await archivoService.unarchive(req.params.id, req.id_funcionario, description)
        return res.status(200).json({
            ok: true,
            message: 'Tramite desarchivado'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

module.exports = router