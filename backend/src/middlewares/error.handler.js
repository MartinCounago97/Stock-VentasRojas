const BaseError = require("../exceptions/BaseError");

const errorHandler = (err, req, res, next) => {
  if (err instanceof BaseError) {
    return res.status(err.statusCode).send({ error: { message: err.message } });
  }
  return res.status(500).send({
    error: {
      message: "Hubo un error inesperado en el sistema",
      stacktrace: err,
    },
  });
};

module.exports = errorHandler;
