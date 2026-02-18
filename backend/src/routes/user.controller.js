// const express = require("express");
// const router = express.Router();
// const userService = require("../services/user.service");
// const MissingFieldsError = require("../exceptions/MissingFieldsError.js");
// const userServiceInstance = new userService();
// const { verifyRole, verifyToken } = require("../middlewares/role.handler.js");

// router.post("/register", verifyRole("crearUsuario"), async (req, res, next) => {
//   try {
//     const { name, password, username, roleId } = req.body || {};
//     if (!password || !username || !roleId) {
//       const missingFields = [];
//       if (!username) missingFields.push("username");
//       if (!password) missingFields.push("constraseña");
//       if (!roleId) missingFields.push("rol");
//       throw new MissingFieldsError(missingFields);
//     }
//     const data = await userServiceInstance.registerUser(
//       name,
//       password,
//       username,
//       roleId
//     );
//     res.status(201).json({ data });
//   } catch (error) {
//     //logger.error(error.message, { stack: error.stack });
//     return next(error);
//   }
// });

// router.post("/login", async (req, res, next) => {
//   try {
//     const { username, password } = req.body || {};

//     if (!username || !password) {
//       const missingFields = [];
//       if (!username) missingFields.push("usuario");
//       if (!password) missingFields.push("constraseña");
//       throw new MissingFieldsError(missingFields);
//     }

//     const data = await userServiceInstance.loginUser(username, password);

//     res.status(200).json({ data });
//   } catch (error) {
//     //logger.error(error.message, { stack: error.stack });
//     return next(error);
//   }
// });

// router.get("/verify", verifyToken(), async (req, res, next) => {
//   try {
//     const data = await userServiceInstance.verifyUserAndRefreshToken(
//       req.user._id,
//       req.headers.authorization
//     );
//     if (!data) {
//       throw new InvalidTokenError("Usuario inválido");
//     }
//     res.status(200).json({ data });
//   } catch (error) {
//     //logger.error(error.message, { stack: error.stack });
//     return next(error);
//   }
// });

// router.get("/", verifyRole("verUsuarios"), async (req, res, next) => {
//   try {
//     const { name, username, roleId, id, startDate, endDate } = req.query;
//     const data = await userServiceInstance.getUsers(
//       id,
//       name,
//       username,
//       roleId,
//       startDate,
//       endDate
//     );
//     res.status(200).json({ data });
//   } catch (error) {
//     //logger.error(error.message, { stack: error.stack });
//     return next(error);
//   }
// });

// router.get("/:id", verifyRole("verDetalleUsuario"), async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const data = await userServiceInstance.getUser(id);
//     res.status(200).json({ data });
//   } catch (error) {
//     //logger.error(error.message, { stack: error.stack });
//     return next(error);
//   }
// });

// router.post("/logout", async (req, res, next) => {
//   try {
//     const token = req.header("Authorization");
//     await userServiceInstance.addToBlacklist(token);

//     res.status(200).json({ data: "Sesion cerrada" });
//   } catch (error) {
//     //logger.error(error.message, { stack: error.stack });
//     return next(error);
//   }
// });

// router.put("/:id", verifyRole("editarUsuario"), async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { name, username, password, roleId } = req.body || {};

//     const data = await userServiceInstance.editUser(
//       id,
//       name,
//       username,
//       password,
//       roleId
//     );
//     res.status(200).json({ data });
//   } catch (error) {
//     //logger.error(error.message, { stack: error.stack });
//     return next(error);
//   }
// });

// module.exports = router;
