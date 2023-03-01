const SalidaModel = require('../models/salida.model')
const EntradaModel = require('../models/entrada.model')
const { ExternoModel } = require('../../Tramites/models/externo.model')
class SalidaService {
    async get(id_cuenta, limit, offset) {
        offset = offset ? offset : 0;
        limit = limit ? limit : 10;
        offset = offset * limit;
        const [mails, length] = await Promise.all([
            SalidaModel.find({ "emisor.cuenta": id_cuenta })
                .sort({ _id: -1 })
                .skip(offset)
                .limit(limit)
                .populate({
                    path: "tramite",
                    select: "alterno estado",
                    populate: {
                        path: "tipo_tramite",
                        select: "nombre -_id",
                    },
                })
                .populate({
                    path: "receptor.cuenta",
                    select: "_id",
                    populate: [
                        {
                            path: "dependencia",
                            select: "nombre -_id",
                            populate: {
                                path: "institucion",
                                select: "sigla -_id",
                            },
                        },
                    ],
                }),
            SalidaModel.count({ "emisor.cuenta": id_cuenta }),
        ]);
        return { mails, length }
    }


    async cancel(id_bandeja, id_cuenta) {
        const cancelMail = await SalidaModel.findById(id_bandeja)
        if (cancelMail.recibido !== undefined) {
            throw ({ status: 400, message: 'El tramite ya ha sido evaluado por el funcionario receptor.' });
        }
        await Promise.all([
            SalidaModel.findByIdAndDelete(id_bandeja),
            EntradaModel.findOneAndDelete({ tramite: cancelMail.tramite, 'emisor.cuenta': cancelMail.emisor.cuenta, 'receptor.cuenta': cancelMail.receptor.cuenta })
        ])
        // verify if all send for update state
        const processActive = await EntradaModel.findOne({ tramite: cancelMail.tramite, 'emisor.cuenta': id_cuenta })
        if (!processActive) {
            const existWorkflow = await SalidaModel.findOne({ tramite: cancelMail.tramite })
            if (existWorkflow) {
                // revert delete mail entrada for send
                let mailOld = await SalidaModel.findOne({ tramite: cancelMail.tramite, 'receptor.cuenta': id_cuenta, recibido: true }).sort({ _id: -1 })
                mailOld = mailOld.toObject()
                delete mailOld._id
                delete mailOld.__v
                const newMailOld = new EntradaModel(mailOld)
                await newMailOld.save()
                return `El tramite ha vuelto ha su bandeja de entrada`
            }
            else {
                let tramiteDB
                switch (cancelMail.tipo) {
                    // case "tramites_internos":
                    //     tramiteDB = await E.findByIdAndUpdate(mailDelete.tramite, {
                    //         estado: "INSCRITO",
                    //     });
                    //     break;
                    case "tramites_externos":
                        tramiteDB = await ExternoModel.findByIdAndUpdate(cancelMail.tramite, {
                            estado: "INSCRITO",
                        });
                        break;
                }
                return `Todos los envios realizados para el tramite: ${tramiteDB.alterno} se han cancelado. El estado ahora es: INSCRITO.`
            }
        }
        return 'El funcionario receptor ya no podra ver el tramite enviado'
    }



}





module.exports = SalidaService