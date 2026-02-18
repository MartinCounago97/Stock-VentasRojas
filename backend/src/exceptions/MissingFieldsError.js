const BaseError = require("./BaseError");

class MissingFieldsError extends BaseError {
  constructor(fields) {
    super(`Los campos ${fields.join(", ")} son requeridos.`, 400);
  }
}

module.exports = MissingFieldsError;
