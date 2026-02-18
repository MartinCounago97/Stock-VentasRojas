const BaseError = require("./BaseError");

class InvalidOperationError extends BaseError {
  constructor(message) {
    super(message, 400);
  }
}

module.exports = InvalidOperationError;
