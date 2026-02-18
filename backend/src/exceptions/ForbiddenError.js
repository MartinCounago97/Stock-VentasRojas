const BaseError = require("./BaseError");

class ForbiddenError extends BaseError {
    constructor() {
        super("No autorizado.", 403);
    }
}

module.exports = ForbiddenError;