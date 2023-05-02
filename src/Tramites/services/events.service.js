const EventModel = require('../models/events.model')

exports.getEventsOfProcedure = async (id_procedure) => {
    return await EventModel.find({ procedure: id_procedure }).populate('officer', 'nombre paterno materno cargo').sort({ date: -1 })
}