const BaseError = require("./BaseError");

class DateTimeError extends BaseError {
    constructor(field) {
        super(field, 400);
    }
}

module.exports = DateTimeError;