const { request } = require("express");

exports.getPaginationParams = (queryParams) => {
    let { limit, offset } = queryParams
    limit = (parseInt(limit) === NaN || limit === undefined) ? 10 : parseInt(limit)
    offset = (parseInt(offset) === NaN || offset === undefined) ? 0 : parseInt(offset)
    offset = offset * limit
    return { limit, offset }
}