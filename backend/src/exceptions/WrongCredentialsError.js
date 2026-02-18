const BaseError = require("./BaseError");

class WrongCredentialsError extends BaseError {
  constructor() {
    super("Credenciales inválidas.", 401);
  }
}

module.exports = WrongCredentialsError;
