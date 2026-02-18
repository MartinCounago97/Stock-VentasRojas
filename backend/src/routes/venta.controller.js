const express = require("express");
const router = express.Router();

const ventaService = require("../services/venta.service");
const adminAuth = require("../middlewares/admin-auth");

// GET /api/ventas?estado=pendiente&origen=catalogo_web&q=martin&limit=50
router.get("/", adminAuth, async (req, res, next) => {
  try {
    const ventas = await ventaService.listarVentas(req.query);
    res.status(200).json({ data: ventas });
  } catch (e) {
    next(e);
  }
});

// GET /api/ventas/:id
router.get("/:id", adminAuth, async (req, res, next) => {
  try {
    const venta = await ventaService.obtenerVentaPorId(req.params.id);
    res.status(200).json({ data: venta });
  } catch (e) {
    next(e);
  }
});

// POST /api/ventas  (crea PENDIENTE)
// Nota: si querés permitir que el catálogo cree ventas sin adminAuth, sacalo acá y validamos por origen.
router.post("/", async (req, res, next) => {
  try {
    const venta = await ventaService.crearVenta(req.body);
    res.status(201).json({ data: venta });
  } catch (e) {
    next(e);
  }
});

// PUT /api/ventas/:id  (modificar antes de confirmar)
router.put("/:id", adminAuth, async (req, res, next) => {
  try {
    const venta = await ventaService.actualizarVentaPendiente(
      req.params.id,
      req.body
    );
    res.status(200).json({ data: venta });
  } catch (e) {
    next(e);
  }
});

// POST /api/ventas/:id/confirmar
router.post("/:id/confirmar", adminAuth, async (req, res, next) => {
  try {
    const venta = await ventaService.confirmarVenta(req.params.id);
    res.status(200).json({ data: venta });
  } catch (e) {
    next(e);
  }
});

// POST /api/ventas/:id/rechazar
router.post("/:id/rechazar", adminAuth, async (req, res, next) => {
  try {
    const { motivo } = req.body || {};
    const venta = await ventaService.rechazarVenta(req.params.id, motivo);
    res.status(200).json({ data: venta });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
