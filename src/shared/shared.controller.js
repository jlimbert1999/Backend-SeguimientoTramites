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
module.exports = router