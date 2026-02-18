const express = require("express");
const router = express.Router();

const CatalogAdminService = require("../services/catalog-admin.service");
const catalogAdminServiceInstance = new CatalogAdminService();

const { verifyRole } = require("../middlewares/role.handler");

// ---- CATEGORIES ----
router.post("/categories",
    //  verifyRole("crearCategoria"), 
    async (req, res, next) => {
        try {
            const data = await catalogAdminServiceInstance.createCategory(req.body);
            res.status(201).json({ data });
        } catch (e) {
            return next(e);
        }
    });

router.put("/categories/:id",
    // verifyRole("editarCategoria"),
    async (req, res, next) => {
        try {
            const data = await catalogAdminServiceInstance.updateCategory(req.params.id, req.body);
            res.status(200).json({ data });
        } catch (e) {
            return next(e);
        }
    });

router.delete("/categories/:id",
    // verifyRole("borrarCategoria"), 
    async (req, res, next) => {
        try {
            const data = await catalogAdminServiceInstance.deleteCategory(req.params.id);
            res.status(200).json({ data });
        } catch (e) {
            return next(e);
        }
    });

// ---- PRODUCTS ----
router.post("/products",
    // verifyRole("crearProducto"), 
    async (req, res, next) => {
        try {
            const data = await catalogAdminServiceInstance.createProduct(req.body);
            res.status(201).json({ data });
        } catch (e) {
            return next(e);
        }
    });

router.put("/products/:id",
    // verifyRole("editarProducto"),
    async (req, res, next) => {
        try {
            const data = await catalogAdminServiceInstance.updateProduct(req.params.id, req.body);
            res.status(200).json({ data });
        } catch (e) {
            return next(e);
        }
    });

router.delete("/products/:id",
    // verifyRole("borrarProducto"), 
    async (req, res, next) => {
        try {
            const data = await catalogAdminServiceInstance.deleteProduct(req.params.id);
            res.status(200).json({ data });
        } catch (e) {
            return next(e);
        }
    });

// ---- PROMOTIONS ----
router.post("/promotions",
    // verifyRole("crearPromo"), 
    async (req, res, next) => {
        try {
            const data = await catalogAdminServiceInstance.createPromotion(req.body);
            res.status(201).json({ data });
        } catch (e) {
            return next(e);
        }
    });

router.put("/promotions/:id",
    // verifyRole("editarPromo"),
    async (req, res, next) => {
        try {
            const data = await catalogAdminServiceInstance.updatePromotion(req.params.id, req.body);
            res.status(200).json({ data });
        } catch (e) {
            return next(e);
        }
    });

router.delete("/promotions/:id",
    // verifyRole("borrarPromo"), 
    async (req, res, next) => {
        try {
            const data = await catalogAdminServiceInstance.deletePromotion(req.params.id);
            res.status(200).json({ data });
        } catch (e) {
            return next(e);
        }
    });

module.exports = router;
