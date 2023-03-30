const router = require("express").Router();
const { verificarToken } = require('../../middlewares/jwt')

const { request, response } = require('express');
const { ServerErrorResponde } = require('../../helpers/responses')
const AuthService = require('./services/auth.service')
const authService = new AuthService()

router.post('/', async (req = request, res = response) => {
    try {
        const { login, password } = req.body
        const { token, number_mails } = await authService.login(login, password)
        return res.status(200).json({
            token,
            number_mails
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/verify', verificarToken, async (req = request, res = response) => {
    try {
        const { token, Menu } = await authService.renovar_token(req.id_cuenta)
        return res.status(200).json({
            token,
            Menu
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

module.exports = router;
