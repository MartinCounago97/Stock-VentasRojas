const BaseError = require("./BaseError");

class NotFoundError extends BaseError {
  constructor(message) {
    super(message, 404);
  }
}

module.exports = NotFoundError;
