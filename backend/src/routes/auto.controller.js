const express = require("express");
const router = express.Router();
const multer = require("multer");

const autoService = require("../services/auto.service");
const adminAuth = require("../middlewares/admin-auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/", async (req, res, next) => {
  try {
    const autos = await autoService.listarAutos(req.query);
    res.status(200).json({ data: autos });
  } catch (e) {
    next(e);
  }
});

/** ✅ IMÁGENES (tiene que ir ANTES de /:id) */
router.get("/:id/imagenes", async (req, res, next) => {
  try {
    const imagenes = await autoService.obtenerImagenes(req.params.id);
    res.status(200).json({ data: imagenes });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const auto = await autoService.obtenerAutoPorId(req.params.id);
    res.status(200).json({ data: auto });
  } catch (e) {
    next(e);
  }
});

router.post("/", adminAuth, async (req, res, next) => {
  try {
    const auto = await autoService.crearAuto(req.body);
    res.status(201).json({ data: auto });
  } catch (e) {
    next(e);
  }
});

router.put("/:id", adminAuth, async (req, res, next) => {
  try {
    const auto = await autoService.actualizarAuto(req.params.id, req.body);
    res.status(200).json({ data: auto });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", adminAuth, async (req, res, next) => {
  try {
    const result = await autoService.eliminarAuto(req.params.id);
    res.status(200).json({ data: result });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/estado", adminAuth, async (req, res, next) => {
  try {
    const auto = await autoService.cambiarEstado(
      req.params.id,
      req.body.estado
    );
    res.status(200).json({ data: auto });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/destacado", adminAuth, async (req, res, next) => {
  try {
    const auto = await autoService.marcarDestacado(
      req.params.id,
      req.body.destacado
    );
    res.status(200).json({ data: auto });
  } catch (e) {
    next(e);
  }
});

/** ✅ Upload 1 imagen */
router.post(
  "/:id/image",
  adminAuth,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Falta el archivo image" });
      }

      // ✅ Este es el método real en tu service
      const auto = await autoService.subirImagen(req.params.id, req.file);

      res.status(200).json({ data: auto });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/:id/images",
  adminAuth,
  upload.array("images", 10), // máximo 10 imágenes
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Faltan archivos images" });
      }

      const auto = await autoService.subirMultiplesImagenes(
        req.params.id,
        req.files
      );

      res.status(200).json({ data: auto });
    } catch (e) {
      next(e);
    }
  }
);

// ✅ Borrar 1 imagen (DB + archivo)
router.delete("/:id/images", adminAuth, async (req, res, next) => {
  try {
    const { url } = req.body; // ejemplo: "/uploads/autos/uuid.webp"
    if (!url) return res.status(400).json({ error: "Falta el campo url" });

    const auto = await autoService.borrarImagenPorUrl(req.params.id, url);
    res.status(200).json({ data: auto });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/with-images",
  adminAuth,
  upload.array("images", 10),
  async (req, res, next) => {
    try {
      // data viene como strings en multipart
      const body = req.body;

      // si querés, convertí números:
      const data = {
        ...body,
        anio: body.anio ? Number(body.anio) : undefined,
        kilometros: body.kilometros ? Number(body.kilometros) : undefined,
        precio: body.precio ? Number(body.precio) : undefined,
        destacado:
          body.destacado === "true"
            ? true
            : body.destacado === "false"
            ? false
            : undefined,
        activo:
          body.activo === "true"
            ? true
            : body.activo === "false"
            ? false
            : undefined,
      };

      // 1) crear auto
      const auto = await autoService.crearAuto(data);

      // 2) subir imágenes si vienen
      if (req.files && req.files.length > 0) {
        await autoService.subirMultiplesImagenes(auto._id, req.files);
      }

      // 3) devolver auto actualizado
      const updated = await autoService.obtenerAutoPorId(auto._id);
      res.status(201).json({ data: updated });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
