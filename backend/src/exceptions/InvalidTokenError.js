const BaseError = require("./BaseError");

class InvalidTokenError extends BaseError {
  constructor() {
    super("Su sesión ha caducado", 401);
  }
}

module.exports = InvalidTokenError;
