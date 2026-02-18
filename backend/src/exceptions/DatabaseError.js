const BaseError = require("./BaseError");

class DatabaseError extends BaseError {
    constructor() {
        super(`Error obteniendo datos de SQL Server`, 500);
    }
}

module.exports = DatabaseError;