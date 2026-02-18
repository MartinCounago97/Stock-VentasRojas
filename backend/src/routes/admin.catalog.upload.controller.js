const express = require("express");
const router = express.Router();
const multer = require("multer");

const { verifyRole } = require("../middlewares/role.handler");
const CatalogAdminUploadService = require("../services/catalog-admin-upload.service");
const uploadService = new CatalogAdminUploadService();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.post(
    "/products/:id/image",
    //   verifyRole("editarProducto"),
    upload.single("image"),
    async (req, res, next) => {
        try {
            const { id } = req.params;

            if (!req.file) {
                return res.status(400).json({ error: "Falta el archivo image" });
            }

            console.log("UPLOAD file:", {
                hasFile: !!req.file,
                mimetype: req.file?.mimetype,
                size: req.file?.size,
                hasBuffer: !!req.file?.buffer,
            });

            const data = await uploadService.uploadProductImage(id, req.file);
            res.status(200).json({ data });
        } catch (e) {
            return next(e);
        }
    }
);


router.post(
  "/promotions/:id/image",
  // verifyRole("editarPromo"),
  upload.single("image"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      console.log("UPLOAD PROMO params:", req.params);  

      if (!req.file) {
        return res.status(400).json({ error: "Falta el archivo image" });
      }

      console.log("UPLOAD PROMO file:", {
        hasFile: !!req.file,
        mimetype: req.file?.mimetype,
        size: req.file?.size,
        hasBuffer: !!req.file?.buffer,
      });

      const data = await uploadService.uploadPromotionImage(id, req.file);
      res.status(200).json({ data });
    } catch (e) {
      return next(e);
    }
  }
);

module

module.exports = router;
