const router = require('express').Router()
const { request, response } = require('express');

const { ServerErrorResponde } = require('../../../helpers/responses')
const funcionarioService = require('../services/funcionarios.service')

router.post('', async (req = request, res = response) => {
    try {
        const funcionario = await funcionarioService.add(req.body)
        return res.status(200).json({
            funcionario
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('', async (req = request, res = response) => {
    try {
        const { funcionarios, length } = await funcionarioService.get(req.query.limit, req.query.offset)
        return res.status(200).json({
            funcionarios,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/search/:text', async (req = request, res = response) => {
    try {
        const { funcionarios, length } = await funcionarioService.search(req.query.limit, req.query.offset, req.params.text)
        return res.status(200).json({
            funcionarios,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/search-one/:text', async (req = request, res = response) => {
    try {
        const funcionarios = await funcionarioService.searchOne(req.params.text, req.id_funcionario)
        return res.status(200).json({
            ok: true,
            funcionarios
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/:id', async (req = request, res = response) => {
    try {
        const funcionario = await funcionarioService.edit(req.params.id, req.body)
        return res.status(200).json({
            ok: true,
            funcionario
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.delete('/:id', async (req = request, res = response) => {
    try {
        const funcionario = await funcionarioService.delete(req.params.id)
        return res.status(200).json({
            ok: true,
            funcionario
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

module.exports = router