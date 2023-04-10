const router = require('express').Router()
const { request, response } = require('express');

const { ServerErrorResponde } = require('../../../helpers/responses')
const RolService = require('../services/roles.service')
const rolService = new RolService()

router.post('/roles', async (req = request, res = response) => {
    try {
        const Rol = await rolService.add(req.body)
        return res.status(200).json({
            Rol
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/roles', async (req = request, res = response) => {
    try {
        const Roles = await rolService.get()
        return res.status(200).json({
            Roles
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/roles/:id', async (req = request, res = response) => {
    try {
        const Rol = await rolService.edit(req.body, req.params.id)
        return res.status(200).json({
            Rol
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})



module.exports = router