const EventModel = require('../models/events.model')

exports.getEventsOfProcedure = async (id_procedure) => {
    return await EventModel.find({ procedure: id_procedure }).populate('officer', 'nombre paterno materno cargo').sort({ date: -1 })
}
exports.addEventProcedure = async (id_procedure, id_officer, description, group) => {
    const event = {
        officer: id_officer,
        procedure: id_procedure,
        group,
        description
    }
    await EventModel.create(event)
}