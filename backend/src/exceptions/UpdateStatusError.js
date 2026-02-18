const BaseError = require("./BaseError");

class UpdateStatusError extends BaseError {
  constructor(model) {
    super(`Error al ectualizar estado`, 400);
  }
}

module.exports = UpdateStatusError;
