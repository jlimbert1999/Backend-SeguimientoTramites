const router = require('express').Router()
const { request, response } = require('express');

const  verifyToken  = require('../../middlewares/verifyToken');
const { ServerErrorResponde } = require('../../helpers/responses')

const EntradaService = require('./services/entrada.service')
const SalidaService = require('./services/salida.service');
const ArchivoService = require('../Archivos/services/archivo.service')
const entradaService = new EntradaService();
const salidaService = new SalidaService();
const archivoService = new ArchivoService();

var fs = require("fs");

// ENTRADAS
router.get('/entrada', verifyToken, async (req = request, res = response) => {
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
router.post('/entrada', verifyToken, async (req = request, res = response) => {
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
router.get('/entrada/users/:text', verifyToken, async (req = request, res = response) => {
    try {
        const cuentas = await entradaService.getAccounts(req.params.text, req.id_cuenta)
        return res.status(200).json({
            cuentas
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.get('/entrada/detalles/:id', verifyToken, async (req = request, res = response) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                ok: false,
                message: 'Parametro para la bandeja de entrada incorrecto'
            })
        }
        const details = await entradaService.getDatails(req.params.id)
        return res.status(200).json({
            ok: true,
            details
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/entrada/search/:type', verifyToken, async (req = request, res = response) => {
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




// SALIDAS
router.get('/salida', verifyToken, async (req = request, res = response) => {
    try {
        const { mails, length } = await salidaService.get(req.id_cuenta, req.query.limit, req.query.offset)
        return res.status(200).json({
            mails,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.delete('/salida/:id', verifyToken, async (req = request, res = response) => {
    try {
        const message = await salidaService.cancel(req.params.id, req.id_cuenta)
        return res.status(200).json({
            message
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.get('/salida/search/:type', verifyToken, async (req = request, res = response) => {
    try {
        if (!req.params.type) {
            return res.status(400).json({
                ok: false,
                message: 'Seleccione el tipo de busqueda a realizar INTERNOS / EXTERNOS'
            })
        }
        const { mails, length } = await salidaService.search(req.id_cuenta, req.query.text, req.params.type, req.query.offset, req.query.limit)
        return res.status(200).json({
            mails,
            length
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})



// CONTROL DE FLUJO
router.put('/aceptar/:id', verifyToken, async (req = request, res = response) => {
    try {
        const { image } = req.body
        var base64Data = image.replace(/^data:image\/png;base64,/, "");

        fs.writeFile("firma.png", base64Data, 'base64', function (err) {
            console.log(err);
        });

        return res.status(200).json({
            message: 'se subio'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})
router.put('/rechazar/:id', verifyToken, async (req = request, res = response) => {
    try {
        let { motivo_rechazo } = req.body
        const message = await entradaService.decline(req.params.id, motivo_rechazo)
        return res.status(200).json({
            message
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})

router.put('/concluir/:id', verifyToken, async (req = request, res = response) => {
    try {
        let { descripcion } = req.body
        const mail = await entradaService.conclude(req.params.id, req.id_funcionario, descripcion)
        await archivoService.archiveMail(mail, req.id_funcionario, req.id_dependencia, descripcion)
        return res.status(200).json({
            message: 'Tramite cocluido'
        })
    } catch (error) {
        ServerErrorResponde(error, res)
    }
})










module.exports = router