const router = require("express").Router();
const { request, response } = require('express');

const verifyToken = require('../../middlewares/verifyToken')
const { ServerErrorResponde } = require('../../helpers/responses')

const AuthService = require('./services/auth.service')
const authService = new AuthService()

router.post('/', async (req = request, res = response) => {
    try {
        const { login, password } = req.body
        const { token, mails } = await authService.login(login, password)
        return res.status(200).json({
            token,
            mails
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/verify', verifyToken, async (req = request, res = response) => {
    try {
        const { token, Menu } = await authService.renewToken(req.id_cuenta)
        return res.status(200).json({
            token,
            Menu
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

module.exports = router;
