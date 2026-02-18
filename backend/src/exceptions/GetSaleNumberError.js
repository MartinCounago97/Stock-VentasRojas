const BaseError = require("./BaseError");

class GetSaleNumberError extends BaseError {
    constructor() {
        super(`Error obteniendo numero de factura:`, 500);
    }
}

module.exports = GetSaleNumberError;