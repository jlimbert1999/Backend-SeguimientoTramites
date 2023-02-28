const { response } = require('express')

function ErrorResponse(resp = response, consoleMessage) {
    console.log('[SERVER]: ERROR => ', consoleMessage)
    resp.status(500).json({
        ok: false,
        message: 'Ha ocurrio un error en el servidor'
    })
}

function ServerErrorResponde(error, res) {
    if (!error.status) {
        console.log('[SERVER]: Error => ', error)
        return res.status(500).json({
            ok: false,
            message: 'Ha ocurrido un error en el servidor'
        })
    }
    return res.status(error.status).json({
        ok: false,
        message: error.message
    })
}

function ExceptionResponse(message, status) {
    const error = new Error(message);
    error.status = status
    return error;
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
    SuccessResponse,
    ServerErrorResponde,
    ExceptionResponse
    // BadRequestResponse
}