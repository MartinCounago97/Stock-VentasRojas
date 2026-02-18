const express = require("express");
const router = express.Router();
const multer = require("multer");

const productoService = require("../services/producto.service");
const adminAuth = require("../middlewares/admin-auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/", async (req, res, next) => {
  try {
    const productos = await productoService.listarProductos(req.query);
    res.status(200).json({ data: productos });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const producto = await productoService.obtenerProductoPorId(req.params.id);
    res.status(200).json({ data: producto });
  } catch (e) {
    next(e);
  }
});

router.post("/", adminAuth, async (req, res, next) => {
  try {
    const producto = await productoService.crearProducto(req.body);
    res.status(201).json({ data: producto });
  } catch (e) {
    next(e);
  }
});

router.put("/:id", adminAuth, async (req, res, next) => {
  try {
    const producto = await productoService.actualizarProducto(
      req.params.id,
      req.body
    );
    res.status(200).json({ data: producto });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", adminAuth, async (req, res, next) => {
  try {
    const result = await productoService.eliminarProducto(req.params.id);
    res.status(200).json({ data: result });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/stock", adminAuth, async (req, res, next) => {
  try {
    const producto = await productoService.aplicarMovimientoStock(
      req.params.id,
      req.body
    );
    res.status(200).json({ data: producto });
  } catch (e) {
    next(e);
  }
});

router.get("/:id/movimientos", async (req, res, next) => {
  try {
    const movimientos = await productoService.listarMovimientosPorProducto(
      req.params.id,
      req.query // permite ?tipo=venta&limit=50
    );
    res.status(200).json({ data: movimientos });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/with-image",
  adminAuth,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const body = req.body;

      const data = {
        nombre: body.nombre,
        descripcion: body.descripcion ?? "",
        precio: body.precio !== undefined ? Number(body.precio) : undefined,
        moneda: body.moneda,
        stock: body.stock !== undefined ? Number(body.stock) : 0,
        stockMinimo:
          body.stockMinimo !== undefined && body.stockMinimo !== ""
            ? Number(body.stockMinimo)
            : undefined,
        ubicacionId: body.ubicacionId || undefined,
      };

      const producto = await productoService.crearProductoConImagen(
        data,
        req.file
      );

      res.status(201).json({ data: producto });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
