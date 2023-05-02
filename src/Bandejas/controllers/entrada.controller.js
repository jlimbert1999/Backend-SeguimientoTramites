const router = require('express').Router()
const { request, response } = require('express');
const { ServerErrorResponde } = require('../../../helpers/responses')

const entradaService = require('../services/entrada.service')
const archivoService = require('../../Archivos/services/archivo.service')
const salidaService = require('../services/salida.service')
const observationService = require('../../Tramites/services/observations.sevice')
const { getOne: getProcedureExternal } = require('../../Tramites/services/externo.service')
const { getOne: getProcedureInternal } = require('../../Tramites/services/interno.service')
// ENTRADAS
router.get('/', async (req = request, res = response) => {
    try {
        const { limit, offset } = req.query
        const { mails, length } = await entradaService.get(req.id_cuenta, limit, offset)
        return res.status(200).json({
            mails,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.post('/', async (req = request, res = response) => {
    try {
        let { receptores, ...data } = req.body
        const MailsDB = await entradaService.add(receptores, data, req.id_cuenta, req.id_funcionario)
        return res.status(200).json({
            mails: MailsDB
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/users/:text', async (req = request, res = response) => {
    try {
        const cuentas = await entradaService.searchAccountsForSend(req.params.text, req.id_cuenta)
        return res.status(200).json({
            cuentas
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/:id', async (req = request, res = response) => {
    try {
        const mail = await entradaService.getDetailsOfMail(req.params.id)
        const promises = [
            observationService.getObservationsOfProcedure(mail.tramite),
            entradaService.getLocationProcedure(mail.tramite),
            salidaService.getWorkflowProcedure(mail.tramite)
        ]
        mail.tipo === 'tramites_externos'
            ? promises.unshift(getProcedureExternal(mail.tramite))
            : promises.unshift(getProcedureInternal(mail.tramite))
        const [procedure, observations, location, workflow] = await Promise.all(promises)
        return res.status(200).json({
            ok: true,
            mail,
            procedure,
            observations,
            location,
            workflow
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/search/:type', async (req = request, res = response) => {
    try {
        if (!req.params.type) {
            return res.status(400).json({
                ok: false,
                message: 'Seleccione el tipo de busqueda a realizar INTERNOS / EXTERNOS'
            })
        }
        const { mails, length } = await entradaService.search(req.id_cuenta, req.query.text, req.params.type, req.query.offset, req.query.limit)
        return res.status(200).json({
            mails,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.put('/aceptar/:id', async (req = request, res = response) => {
    try {
        await entradaService.aceptProcedure(req.params.id)
        return res.status(200).json({
            ok: true,
            message: 'Tramite aceptado!'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/rechazar/:id', async (req = request, res = response) => {
    try {
        let { motivo_rechazo } = req.body
        await entradaService.declineProcedure(req.params.id, motivo_rechazo)
        return res.status(200).json({
            ok: true,
            message: 'Tramite rechazado'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.put('/observar/:id_tramite', async (req = request, res = response) => {
    const { description } = req.body
    try {
        const mail = await entradaService.checkMailManager(req.params.id_tramite, req.id_cuenta)
        const observation = await observationService.addObservation(
            req.params.id_tramite,
            req.id_cuenta,
            req.id_funcionario,
            mail.tipo,
            description
        )
        return res.status(200).json({
            ok: true,
            observation
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/corregir/:id_observacion', async (req = request, res = response) => {
    try {
        const state = await observationService.markAsSolved(req.params.id_observacion, req.id_cuenta)
        return res.status(200).json({
            ok: true,
            state
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})


router.put('/concluir/:id', async (req = request, res = response) => {
    try {
        let { descripcion } = req.body
        const mail = await entradaService.concludeProcedure(req.params.id, req.id_funcionario, descripcion)
        await archivoService.archiveMail(mail, descripcion)
        return res.status(200).json({
            message: 'Tramite concluido y archivado'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})








module.exports = router