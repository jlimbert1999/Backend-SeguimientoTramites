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
    let alterno = `${typeProcedure.segmento}-${account.dependencia.institucion.sigla}-${process.env.CONFIG_YEAR}`
    const regex = new RegExp(alterno, 'i')
    let correlativo = 0
    let numberZeros = 0
    if (group === 'tramites_externos') {
        correlativo = await ExternoModel.find({ alterno: regex }).count()
        numberZeros = 6
    }
    else {
        correlativo = await InternoModel.find({ alterno: regex }).count()
        numberZeros = 5
    }
    correlativo += 1
    return `${alterno}-${addLeadingZeros(correlativo, numberZeros)}`
}
const addLeadingZeros = (num, totalLength) => {
    return String(num).padStart(totalLength, '0');
}

