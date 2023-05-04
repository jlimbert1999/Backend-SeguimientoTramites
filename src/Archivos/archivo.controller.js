const router = require('express').Router()
const { ServerErrorResponde } = require('../../helpers/responses')
const { getPaginationParams } = require('../../helpers/Pagintation')
const archivoService = require('./services/archivo.service')


router.get('/', async (req = request, res = response) => {
    try {
        const { limit, offset } = getPaginationParams(req.query)
        const {archives, length} = await archivoService.get(req.id_cuenta, limit, offset)
        return res.status(200).json({
            ok: true,
            archives,
            length
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