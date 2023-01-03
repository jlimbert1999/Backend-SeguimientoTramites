const { response } = require('express')

function ErrorResponse(resp = response, consoleMessage) {
    console.log('[SERVER]: ERROR => ', consoleMessage)
    resp.status(500).json({
        ok: false,
        message: 'Ha ocurrio un error en el servidor'
    })
}
function SuccessResponse(res = response, data, message) {
    switch (message) {
        case null:
            res.status(200).json({
                ok: true,
                data
            })
            break;

        default:
            res.status(200).json({
                ok: true,
                data,
                message
            })
            break;
    }
}



module.exports = {
    ErrorResponse,
    SuccessResponse
}