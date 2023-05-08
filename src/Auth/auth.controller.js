const router = require("express").Router();
const { request, response } = require('express');

const verifyToken = require('../../middlewares/verifyToken')
const { ServerErrorResponde } = require('../../helpers/responses')

const authService = require('./services/auth.service')

router.post('/', async (req = request, res = response) => {
    try {
        const { login, password } = req.body
        const { token, resources,imbox } = await authService.login(login, password)
        return res.status(200).json({
            ok: true,
            token,
            resources,
            imbox
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/verify', verifyToken, async (req = request, res = response) => {
    try {
        const { token, resources, code, menu } = await authService.renewToken(req.id_cuenta)
        return res.status(200).json({
            ok: true,
            token,
            resources,
            code,
            menu
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

module.exports = router;
