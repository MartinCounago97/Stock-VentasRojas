const express = require("express");
const router = express.Router();

const ConfigurationService = require("../services/configuration.service");
const service = new ConfigurationService();

// Obtener configuración
router.get("/", async (req, res, next) => {
  try {
    const data = await service.getConfiguration();
    res.status(200).json({ data });
  } catch (e) {
    return next(e);
  }
});

// Crear / actualizar configuración
router.put("/", async (req, res, next) => {
  try {
    const data = await service.upsertConfiguration(req.body);
    res.status(200).json({ data });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
