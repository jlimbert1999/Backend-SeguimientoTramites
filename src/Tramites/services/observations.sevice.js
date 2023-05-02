const ObservationModel = require('../models/observations.model')
const ExternoModel = require('../models/externo.model')
const InternoModel = require('../models/interno.model')
exports.getObservationsOfProcedure = async (id_procedure) => {
    return await ObservationModel.find({ procedure: id_procedure }).populate('officer', 'nombre paterno materno cargo').sort({ date: -1 })
}
exports.addObservation = async (id_procedure, id_account, id_officer, group, description) => {
    const observation = {
        procedure: id_procedure,
        account: id_account,
        officer: id_officer,
        group,
        description
    }
    group === 'tramites_externos'
        ? await ExternoModel.findByIdAndUpdate(id_procedure, { estado: 'OBSERVADO' })
        : await InternoModel.findByIdAndUpdate(id_procedure, { estado: 'OBSERVADO' })
    return (await ObservationModel.create(observation)).populate('officer', 'nombre paterno materno cargo')
}
exports.markAsSolved = async (id_observation, id_account) => {
    let observation = await ObservationModel.findById(id_observation)
    if (observation.account.toString() !== id_account.toString()) throw ({ status: 400, message: 'Esta observacion ha sido registrada por otro funcionario' });
    if (observation.solved) throw ({ status: 400, message: 'Esta observacion ya fue corregida' });
    await ObservationModel.updateOne({ _id: id_observation }, { solved: true })
    const pendingObservation = await ObservationModel.findOne({ procedure: observation.procedure, solved: false })
    if (!pendingObservation) {
        observation.group === 'tramites_externos'
            ? await ExternoModel.findByIdAndUpdate(observation.procedure, { estado: 'EN REVISION' })
            : await InternoModel.findByIdAndUpdate(observation.procedure, { estado: 'EN REVISION' })
        return 'EN REVISION'
    }
    return 'OBSERVADO'
}