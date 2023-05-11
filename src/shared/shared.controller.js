const router = require('express').Router()
const { request, response } = require('express');
const { ServerErrorResponde } = require('../../helpers/responses')

const sharedService = require('./shared.service')

router.get('/procedure/:group/:id_procedure', async (req = request, res = response) => {
    try {
        const { group, id_procedure } = req.params
        const { procedure, location, workflow, observations, events } = await sharedService.getAllDataProcedure(group, id_procedure)
        return res.status(200).json({
            ok: true,
            procedure,
            location,
            workflow,
            observations,
            events
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/my-account/:id_account', async (req = request, res = response) => {
    try {
        const account = await sharedService.getMyAccount(req.params.id_account)
        return res.status(200).json({
            ok: true,
            account
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/my-account/:id_account', async (req = request, res = response) => {
    try {
        const { login } = await sharedService.updateMyAccount(req.params.id_account, req.body)
        return res.status(200).json({
            ok: true,
            login
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
module.exports = router