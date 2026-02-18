const BaseError = require("./BaseError");

class DuplicateError extends BaseError {
  constructor(model) {
    super(`El ${model} seleccionado ya esta registrado.`, 400);
  }
}

module.exports = DuplicateError;
