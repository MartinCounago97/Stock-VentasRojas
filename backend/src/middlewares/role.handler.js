require("dotenv").config();
const jwt = require("jsonwebtoken");
const InvalidTokenError = require("../exceptions/InvalidTokenError");
const ForbiddenError = require("../exceptions/ForbiddenError");
const RoleService = require("../services/role.service");
const UserService = require("../services/user.service");

function verifyRole(resourceName) {
  return async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      return next(new InvalidTokenError());
    }

    jwt.verify(
      token,
      process.env.SECRET_PASSWORD,
      async (err, decoded) => {
        if (err || !decoded || !decoded.user || !decoded.user.roleId) {
          return next(new InvalidTokenError());
        }

        const userService = new UserService();
        const tokenExistsInBlackList = await userService.tokenExists(token);
        if (tokenExistsInBlackList) {
          return next(new InvalidTokenError());
        }

        const roleService = new RoleService();
        try {
          const hasAccess = await roleService.checkAccess(
            decoded.user.roleId,
            resourceName
          );

          if (!hasAccess) {
            throw new ForbiddenError(
              "No tiene permisos para realizar esta acción"
            );
          }

          req.user = decoded.user;
          next();
        } catch (error) {
          next(
            new ForbiddenError("Ha ocurrid un error autenticando su sesión")
          );
        }
      }
    );
  };
}

function verifyToken() {
  return async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      return next(new InvalidTokenError());
    }

    jwt.verify(
      token,
      process.env.SECRET_PASSWORD,
      async (err, decoded) => {
        if (err || !decoded || !decoded.user || !decoded.user.roleId) {
          return next(new InvalidTokenError());
        }

        req.user = decoded.user;
        next();
      }
    );
  };
}

function getUserDetailsFromToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.SECRET_PASSWORD);
    return decoded.user || null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  verifyRole,
  verifyToken,
  getUserDetailsFromToken,
};
