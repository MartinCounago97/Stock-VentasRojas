const express = require("express");
const router = express.Router();

const ubicacionService = require("../services/ubicacion.service");
const adminAuth = require("../middlewares/admin-auth");

router.get("/", async (req, res, next) => {
  try {
    const ubicaciones = await ubicacionService.listarUbicaciones(req.query);
    res.status(200).json({ data: ubicaciones });
  } catch (e) {
    next(e);
  }
});

router.get("/estructura", adminAuth, async (req, res, next) => {
  try {
    const data = await ubicacionService.obtenerEstructura(req.query);
    res.status(200).json({ data });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const ubicacion = await ubicacionService.obtenerUbicacionPorId(
      req.params.id
    );
    res.status(200).json({ data: ubicacion });
  } catch (e) {
    next(e);
  }
});

router.post("/", adminAuth, async (req, res, next) => {
  try {
    const ubicacion = await ubicacionService.crearUbicacion(req.body);
    res.status(201).json({ data: ubicacion });
  } catch (e) {
    next(e);
  }
});

router.put("/:id", adminAuth, async (req, res, next) => {
  try {
    const ubicacion = await ubicacionService.actualizarUbicacion(
      req.params.id,
      req.body
    );
    res.status(200).json({ data: ubicacion });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/ubicaciones/:id (baja lógica)
router.delete("/:id", adminAuth, async (req, res, next) => {
  try {
    const result = await ubicacionService.eliminarUbicacion(req.params.id);
    res.status(200).json({ data: result });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
