const AccountModel = require('../src/Configuraciones/models/cuentas.model')
const TypeProcedureModel = require('../src/Configuraciones/models/tipos.model')
const ExternoModel = require('../src/Tramites/models/externo.model')
const InternoModel = require('../src/Tramites/models/interno.model')
require('dotenv').config()
exports.generateAlterno = async (id_account, id_typeProcedure, group) => {
    const allowedGroups = ['tramites_externos', 'tramites_internos']
    if (!allowedGroups.includes(group)) new Error('Group procedure for generate alterno is not defined')
    const [account, typeProcedure] = await Promise.all([
        AccountModel.findById(id_account)
            .select('dependencia')
            .populate({
                path: 'dependencia',
                select: 'institucion',
                populate: {
                    path: 'institucion',
                    select: 'sigla'
                }
            }),
        TypeProcedureModel.findById(id_typeProcedure).select('segmento')
    ])
    if (!account.dependencia) throw ({ status: 400, message: 'Esta cuenta no esta habilitada para el registro de tramites' });
    if (!account.dependencia.institucion) throw ({ status: 400, message: 'Esta cuenta no esta habilitada para el registro de tramites' });
    let correlativo = 0
    let alterno = `${typeProcedure.segmento}-${account.dependencia.institucion.sigla}-${process.env.CONFIG_YEAR}`
    const regex = new RegExp(alterno, 'i')
    correlativo = group === 'tramites_externos'
        ? await ExternoModel.find({ alterno: regex }).count()
        : await InternoModel.find({ alterno: regex }).count()
    correlativo += 1
    return `${alterno}-${addLeadingZeros(correlativo, 6)}`
}
const addLeadingZeros = (num, totalLength) => {
    return String(num).padStart(totalLength, '0');
}

