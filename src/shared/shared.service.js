const externoService = require('../Tramites/services/externo.service')
const internoService = require('../Tramites/services/interno.service')
const entradaService = require('../Bandejas/services/entrada.service')
const salidaService = require('../Bandejas/services/salida.service')
const observationService = require('../Tramites/services/observations.sevice')
const eventService = require('../Tramites/services/events.service')

exports.getAllDataProcedure = async (group, id_procedure) => {
    const promises = [
        observationService.getObservationsOfProcedure(id_procedure),
        entradaService.getLocationProcedure(id_procedure),
        salidaService.getWorkflowProcedure(id_procedure),
        eventService.getEventsOfProcedure(id_procedure)
    ]
    group === 'tramites_externos'
        ? promises.unshift(externoService.getOne(id_procedure))
        : promises.unshift(internoService.getOne(id_procedure))
    const [procedure, observations, location, workflow, events] = await Promise.all(promises)
    return { procedure, observations, location, workflow, events }
}
