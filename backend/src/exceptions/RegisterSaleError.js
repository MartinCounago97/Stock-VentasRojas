const BaseError = require("./BaseError");

class RegisterSaleError extends BaseError {
    constructor() {
        super(`Error registrando venta:`, 500);
    }
}

module.exports = RegisterSaleError;