const router = require('express').Router()
const { request, response } = require('express');
const { ServerErrorResponde } = require('../../../helpers/responses')
const entradaService = require('../services/entrada.service')

const { getOne: getProcedureExternal } = require('../../Tramites/services/externo.service')
const { getOne: getProcedureInternal } = require('../../Tramites/services/interno.service')
const { getObservationsOfProcedure, addObservation, markAsSolved } = require('../../Tramites/services/observations.sevice')
const { addEventProcedure, getEventsOfProcedure } = require('../../Tramites/services/events.service')
const { getDependenciesOfInstitucion } = require('../../Configuraciones/services/dependencias.service')
const { getActiveIntituciones } = require('../../Configuraciones/services/instituciones.service')
const { getAccountByDependencie } = require('../../Configuraciones/services/cuentas.service')
const { archiveMail } = require('../../Archivos/services/archivo.service')
const { getWorkflowProcedure } = require('../services/salida.service')
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
router.get('/instituciones', async (req = request, res = response) => {
    try {
        const institutions = await getActiveIntituciones()
        return res.status(200).json({
            institutions
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/dependencias/:id_institucion', async (req = request, res = response) => {
    try {
        const dependencies = await getDependenciesOfInstitucion(req.params.id_institucion)
        return res.status(200).json({
            dependencies
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/cuentas/:id_dependencia', async (req = request, res = response) => {
    try {
        const accounts = await getAccountByDependencie(req.params.id_dependencia)
        return res.status(200).json({
            accounts
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/:id', async (req = request, res = response) => {
    try {
        const mail = await entradaService.getDetailsOfMail(req.params.id)
        const promises = [
            entradaService.getLocationProcedure(mail.tramite),
            getObservationsOfProcedure(mail.tramite),
            getWorkflowProcedure(mail.tramite),
            getEventsOfProcedure(mail.tramite)
        ]
        mail.tipo === 'tramites_externos'
            ? promises.unshift(getProcedureExternal(mail.tramite))
            : promises.unshift(getProcedureInternal(mail.tramite))
        const [procedure, location, observations, workflow, events] = await Promise.all(promises)
        return res.status(200).json({
            ok: true,
            mail,
            procedure,
            observations,
            location,
            workflow,
            events
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
        const observation = await addObservation(
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
        const state = await markAsSolved(req.params.id_observacion, req.id_cuenta)
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
        let { description } = req.body
        const mail = await entradaService.concludeProcedure(req.params.id, req.id_cuenta)
        await Promise.all([
            archiveMail(req.id_cuenta, req.id_funcionario, mail, description),
            addEventProcedure(mail.tramite, req.id_funcionario, `Ha concluido el tramite debido a: ${description}`, mail.tipo)
        ])
        return res.status(200).json({
            ok: true,
            message: 'Tramite concluido y archivado'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

module.exports = router