const BaseError = require("./BaseError");

class UsernameUsedError extends BaseError {
    constructor() {
        super("El nombre de usuario ingresado ya esta en uso.", 400);
    }
}

module.exports = UsernameUsedError;