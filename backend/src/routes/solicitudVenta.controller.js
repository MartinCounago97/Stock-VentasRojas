const express = require("express");
const router = express.Router();
const multer = require("multer");

const solicitudVentaService = require("../services/solicitudVenta.service");
const adminAuth = require("../middlewares/admin-auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/", async (req, res, next) => {
  try {
    const solicitud = await solicitudVentaService.crearSolicitud(req.body);
    res.status(201).json({ data: solicitud });
  } catch (e) {
    next(e);
  }
});

// ✅ USUARIO: subir múltiples imágenes a una solicitud (hasta 10)
router.post(
  "/:id/images",
  upload.array("images", 10),
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Faltan archivos images" });
      }

      const solicitud = await solicitudVentaService.subirMultiplesImagenes(
        req.params.id,
        req.files
      );

      res.status(200).json({ data: solicitud });
    } catch (e) {
      next(e);
    }
  }
);

// ✅ ADMIN (o cualquiera): ver imágenes (metadata)
router.get("/:id/imagenes", async (req, res, next) => {
  try {
    const imagenes = await solicitudVentaService.obtenerImagenes(req.params.id);
    res.status(200).json({ data: imagenes });
  } catch (e) {
    next(e);
  }
});

router.get("/", adminAuth, async (req, res, next) => {
  try {
    const solicitudes = await solicitudVentaService.listarSolicitudes(
      req.query
    );
    res.status(200).json({ data: solicitudes });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", adminAuth, async (req, res, next) => {
  try {
    const solicitud = await solicitudVentaService.obtenerSolicitudPorId(
      req.params.id
    );
    res.status(200).json({ data: solicitud });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/estado", adminAuth, async (req, res, next) => {
  try {
    const solicitud = await solicitudVentaService.cambiarEstado(
      req.params.id,
      req.body.estado
    );
    res.status(200).json({ data: solicitud });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/nota", adminAuth, async (req, res, next) => {
  try {
    const solicitud = await solicitudVentaService.agregarNotaInterna(
      req.params.id,
      req.body.nota
    );
    res.status(200).json({ data: solicitud });
  } catch (e) {
    next(e);
  }
});

// ✅ ADMIN: borrar 1 imagen por URL
router.delete("/:id/images", adminAuth, async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Falta el campo url" });

    const solicitud = await solicitudVentaService.borrarImagenPorUrl(
      req.params.id,
      url
    );
    res.status(200).json({ data: solicitud });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", adminAuth, async (req, res, next) => {
  try {
    const result = await solicitudVentaService.eliminarSolicitud(req.params.id);
    res.status(200).json({ data: result });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/with-images",
  upload.array("images", 10),
  async (req, res, next) => {
    try {
      const body = req.body;

      const data = {
        ...body,
        anio: body.anio ? Number(body.anio) : undefined,
        kilometros: body.kilometros ? Number(body.kilometros) : undefined,
        precioPretendido: body.precioPretendido
          ? Number(body.precioPretendido)
          : undefined,
      };

      // 1) crear solicitud
      const solicitud = await solicitudVentaService.crearSolicitud(data);

      // 2) subir imágenes si vienen
      if (req.files && req.files.length > 0) {
        await solicitudVentaService.subirMultiplesImagenes(
          solicitud._id,
          req.files
        );
      }

      // 3) devolver solicitud actualizada
      const updated = await solicitudVentaService.obtenerSolicitudPorId(
        solicitud._id
      );
      res.status(201).json({ data: updated });
    } catch (e) {
      next(e);
    }
  }
);

router.patch("/:id/notas", adminAuth, async (req, res, next) => {
  try {
    const solicitud = await solicitudVentaService.setNotasInternas(
      req.params.id,
      req.body.notasInternas
    );
    res.status(200).json({ data: solicitud });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id/nota/:index", adminAuth, async (req, res, next) => {
  try {
    const { id, index } = req.params;
    const updated = await solicitudVentaService.eliminarNotaInterna(id, index);
    res.status(200).json({ data: updated });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
