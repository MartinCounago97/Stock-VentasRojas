const Producto = require("../models/producto.model");
const MovimientoStock = require("../models/movimientoStock.model");
const mongoose = require("mongoose");

const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs-extra");

const UPLOAD_DIR = path.resolve(__dirname, "..", "..", "uploads", "productos");

class ProductoService {
  async crearProducto(data) {
    // Asegurar números si vienen como string (por Postman o multipart)
    const payload = {
      ...data,
      precio: data?.precio !== undefined ? Number(data.precio) : data?.precio,
      stock: data?.stock !== undefined ? Number(data.stock) : data?.stock,
      stockMinimo:
        data?.stockMinimo !== undefined && data.stockMinimo !== ""
          ? Number(data.stockMinimo)
          : data?.stockMinimo,
    };

    const producto = await Producto.create(payload);

    // movimiento inicial si stock > 0
    if (producto.stock && producto.stock > 0) {
      await MovimientoStock.create({
        productoId: producto._id,
        tipo: "ingreso",
        cantidad: producto.stock, // positivo
        observaciones: "Stock inicial",
      });
    }

    return producto;
  }

  async obtenerProductoPorId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error("ID inválido");
      err.status = 400;
      throw err;
    }

    const producto = await Producto.findById(id).populate("ubicacionId");
    if (!producto) {
      const err = new Error("Producto no encontrado");
      err.status = 404;
      throw err;
    }

    return producto;
  }

  async listarProductos(filtros = {}) {
    const query = {};

    // filtros típicos
    if (typeof filtros.activo !== "undefined") {
      query.activo = filtros.activo === "true" || filtros.activo === true;
    }

    if (filtros.moneda) query.moneda = filtros.moneda;

    if (filtros.ubicacionId) query.ubicacionId = filtros.ubicacionId;

    // búsqueda por nombre (q)
    if (filtros.q) {
      query.nombre = { $regex: String(filtros.q), $options: "i" };
    }

    // precio min/max
    if (filtros.precioMin || filtros.precioMax) {
      query.precio = {};
      if (filtros.precioMin) query.precio.$gte = Number(filtros.precioMin);
      if (filtros.precioMax) query.precio.$lte = Number(filtros.precioMax);
    }

    let productos = await Producto.find(query)
      .populate("ubicacionId")
      .sort({ createdAt: -1 });

    // bajo stock (en memoria para simplicidad; si querés lo pasamos a query $expr)
    if (filtros.bajoStock === "true" || filtros.bajoStock === true) {
      productos = productos.filter((p) => p.stock <= (p.stockMinimo ?? 0));
    }

    return productos;
  }

  async actualizarProducto(id, data) {
    // Bloqueamos modificación de stock desde PUT (se hace via /stock)
    if (data && Object.prototype.hasOwnProperty.call(data, "stock")) {
      const err = new Error(
        "No se permite actualizar stock por PUT. Usá /:id/stock"
      );
      err.status = 400;
      throw err;
    }

    const payload = {
      ...data,
      precio: data?.precio !== undefined ? Number(data.precio) : data?.precio,
      stockMinimo:
        data?.stockMinimo !== undefined && data.stockMinimo !== ""
          ? Number(data.stockMinimo)
          : data?.stockMinimo,
    };

    const producto = await Producto.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate("ubicacionId");

    if (!producto) {
      const err = new Error("Producto no encontrado");
      err.status = 404;
      throw err;
    }

    return producto;
  }

  async eliminarProducto(id) {
    const producto = await Producto.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!producto) {
      const err = new Error("Producto no encontrado");
      err.status = 404;
      throw err;
    }

    return true;
  }

  async aplicarMovimientoStock(productoId, body) {
    const { cantidad, observaciones } = body || {};

    const cant = Number(cantidad);
    if (!Number.isFinite(cant) || cant === 0) {
      const err = new Error(
        "cantidad inválida (debe ser número distinto de 0)"
      );
      err.status = 400;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(productoId)) {
      const err = new Error("ID inválido");
      err.status = 400;
      throw err;
    }

    const producto = await Producto.findById(productoId);
    if (!producto) {
      const err = new Error("Producto no encontrado");
      err.status = 404;
      throw err;
    }

    const stockNuevo = Number(producto.stock) + cant;

    if (stockNuevo < 0) {
      const err = new Error(
        "Stock insuficiente (no se permite stock negativo)"
      );
      err.status = 400;
      throw err;
    }

    const tipo = cant > 0 ? "ingreso" : "venta";

    producto.stock = stockNuevo;
    await producto.save();

    await MovimientoStock.create({
      productoId: producto._id,
      tipo,
      cantidad: cant, // + / -
      observaciones: observaciones ? String(observaciones) : "",
    });

    return producto;
  }

  async listarMovimientosPorProducto(productoId, filtros = {}) {
    if (!mongoose.Types.ObjectId.isValid(productoId)) {
      const err = new Error("ID inválido");
      err.status = 400;
      throw err;
    }

    const query = { productoId };

    // opcional: filtrar por tipo (ingreso/venta/ajuste)
    if (filtros.tipo) query.tipo = filtros.tipo;

    const limit = filtros.limit ? Math.min(Number(filtros.limit), 200) : 100;

    const movimientos = await MovimientoStock.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return movimientos;
  }

  async _ensureUploadDir() {
    await fs.ensureDir(UPLOAD_DIR);
  }

  _buildUrl(filename) {
    return `/uploads/productos/${filename}`;
  }

  async _saveImage(file) {
    await this._ensureUploadDir();

    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await sharp(file.buffer)
      .resize({ width: 1200 })
      .webp({ quality: 80 })
      .toFile(filepath);

    return {
      filename,
      url: this._buildUrl(filename),
    };
  }

  async crearProductoConImagen(data, file) {
    const producto = await this.crearProducto(data);

    if (file) {
      const image = await this._saveImage(file);
      producto.foto = { url: image.url, filename: image.filename };
      await producto.save();
    }

    return await Producto.findById(producto._id).populate("ubicacionId");
  }

  async borrarFoto(productoId) {
    const producto = await Producto.findById(productoId);
    if (!producto) {
      const err = new Error("Producto no encontrado");
      err.status = 404;
      throw err;
    }

    if (producto.foto?.filename) {
      const filepath = path.join(UPLOAD_DIR, producto.foto.filename);
      await fs.remove(filepath);
    }

    producto.foto = null;
    await producto.save();
    return producto;
  }
}

module.exports = new ProductoService();
