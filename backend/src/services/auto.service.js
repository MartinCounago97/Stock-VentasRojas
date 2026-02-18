const Auto = require("../models/auto.model");
const mongoose = require("mongoose");

const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs-extra");

// ✅ IMPORTANTE: este service está en backend/src/services
// uploads está en backend/uploads/autos
const UPLOAD_DIR = path.resolve(__dirname, "..", "..", "uploads", "autos");

class AutoService {
  async crearAuto(data) {
    const auto = await Auto.create(data);
    return auto;
  }

  async obtenerAutoPorId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error("ID inválido");
      err.status = 400;
      throw err;
    }

    const auto = await Auto.findById(id);
    if (!auto) {
      const err = new Error("Auto no encontrado");
      err.status = 404;
      throw err;
    }

    return auto;
  }

  async listarAutos(filtros = {}) {
    const query = {};

    if (filtros.marca) query.marca = filtros.marca;
    if (filtros.modelo) query.modelo = filtros.modelo;
    if (filtros.estado) query.estado = filtros.estado;
    if (filtros.moneda) query.moneda = filtros.moneda;

    if (filtros.precioMin || filtros.precioMax) {
      query.precio = {};
      if (filtros.precioMin) query.precio.$gte = filtros.precioMin;
      if (filtros.precioMax) query.precio.$lte = filtros.precioMax;
    }

    if (filtros.kmMax) {
      query.kilometros = { $lte: filtros.kmMax };
    }

    if (filtros.anioMin) {
      query.anio = { $gte: filtros.anioMin };
    }

    if (filtros.destacado) {
      query.destacado = true;
    }

    const autos = await Auto.find(query).sort({ createdAt: -1 });
    return autos;
  }

  async actualizarAuto(id, data) {
    const auto = await Auto.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!auto) {
      const err = new Error("Auto no encontrado");
      err.status = 404;
      throw err;
    }

    return auto;
  }

  async eliminarAuto(id) {
    const auto = await Auto.findById(id);
    if (!auto) {
      const err = new Error("Auto no encontrado");
      err.status = 404;
      throw err;
    }

    // 🔥 borrar imágenes físicas
    if (auto.imagenes && auto.imagenes.length > 0) {
      for (const img of auto.imagenes) {
        const filepath = path.join(UPLOAD_DIR, img.filename);
        await fs.remove(filepath);
      }
    }

    await Auto.findByIdAndDelete(id);
    return true;
  }

  async cambiarEstado(id, estado) {
    const estadosValidos = ["disponible", "reservado", "vendido"];

    if (!estadosValidos.includes(estado)) {
      const err = new Error("Estado inválido");
      err.status = 400;
      throw err;
    }

    const auto = await Auto.findByIdAndUpdate(id, { estado }, { new: true });

    if (!auto) {
      const err = new Error("Auto no encontrado");
      err.status = 404;
      throw err;
    }

    return auto;
  }

  async marcarDestacado(id, destacado) {
    const auto = await Auto.findByIdAndUpdate(id, { destacado }, { new: true });

    if (!auto) {
      const err = new Error("Auto no encontrado");
      err.status = 404;
      throw err;
    }

    return auto;
  }

  /* =====================================================
     IMÁGENES
  ===================================================== */

  async _ensureUploadDir() {
    await fs.ensureDir(UPLOAD_DIR);
  }

  _buildUrl(filename) {
    return `/uploads/autos/${filename}`;
  }

  async _saveImage(file) {
    await this._ensureUploadDir();

    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await sharp(file.buffer)
      .resize({ width: 1600 })
      .webp({ quality: 80 })
      .toFile(filepath);

    return {
      filename,
      url: this._buildUrl(filename),
    };
  }

  async subirImagen(id, file) {
    const auto = await Auto.findById(id);
    if (!auto) {
      const err = new Error("Auto no encontrado");
      err.status = 404;
      throw err;
    }

    const image = await this._saveImage(file);

    auto.imagenes.push({
      url: image.url,
      filename: image.filename,
      principal: auto.imagenes.length === 0,
      orden: auto.imagenes.length,
    });

    await auto.save();
    return auto;
  }

  async subirMultiplesImagenes(id, files) {
    const auto = await Auto.findById(id);
    if (!auto) {
      const err = new Error("Auto no encontrado");
      err.status = 404;
      throw err;
    }

    for (const file of files) {
      const image = await this._saveImage(file);

      auto.imagenes.push({
        url: image.url,
        filename: image.filename,
        principal: auto.imagenes.length === 0,
        orden: auto.imagenes.length,
      });
    }

    await auto.save();
    return auto;
  }

  // ✅ Recalcula orden y asegura principal
  _normalizarImagenes(auto) {
    // ordenar por orden actual
    auto.imagenes.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

    // reindexar
    auto.imagenes.forEach((img, idx) => {
      img.orden = idx;
    });

    // asegurar principal si hay imágenes
    if (auto.imagenes.length > 0) {
      const hayPrincipal = auto.imagenes.some((i) => i.principal);
      if (!hayPrincipal) auto.imagenes[0].principal = true;
    }
  }

  // ✅ BORRAR POR imageId (tu método original mejorado)
  async eliminarImagen(autoId, imageId) {
    const auto = await Auto.findById(autoId);
    if (!auto) {
      const err = new Error("Auto no encontrado");
      err.status = 404;
      throw err;
    }

    const img = auto.imagenes.id(imageId);
    if (!img) {
      const err = new Error("Imagen no encontrada");
      err.status = 404;
      throw err;
    }

    const filepath = path.join(UPLOAD_DIR, img.filename);
    await fs.remove(filepath);

    img.remove();

    this._normalizarImagenes(auto);

    await auto.save();
    return auto;
  }

  // ✅ NUEVO: BORRAR POR URL (ideal para Postman)
  async borrarImagenPorUrl(autoId, url) {
    if (!url || typeof url !== "string") {
      const err = new Error("Falta el campo url");
      err.status = 400;
      throw err;
    }

    const auto = await Auto.findById(autoId);
    if (!auto) {
      const err = new Error("Auto no encontrado");
      err.status = 404;
      throw err;
    }

    // Buscar imagen en el array por url
    const idx = auto.imagenes.findIndex((img) => img.url === url);
    if (idx === -1) {
      const err = new Error("Imagen no encontrada");
      err.status = 404;
      throw err;
    }

    const img = auto.imagenes[idx];

    // Borrar archivo físico
    const filepath = path.join(UPLOAD_DIR, img.filename);
    await fs.remove(filepath);

    // Quitar de DB
    auto.imagenes.splice(idx, 1);

    this._normalizarImagenes(auto);

    await auto.save();
    return auto;
  }

  async marcarImagenPrincipal(autoId, imageId) {
    const auto = await Auto.findById(autoId);
    if (!auto) {
      const err = new Error("Auto no encontrado");
      err.status = 404;
      throw err;
    }

    auto.imagenes.forEach((img) => {
      img.principal = img._id.toString() === imageId;
    });

    await auto.save();
    return auto;
  }

  async obtenerImagenes(autoId) {
    if (!mongoose.Types.ObjectId.isValid(autoId)) {
      const err = new Error("ID inválido");
      err.status = 400;
      throw err;
    }

    const auto = await Auto.findById(autoId).select("imagenes");
    if (!auto) {
      const err = new Error("Auto no encontrado");
      err.status = 404;
      throw err;
    }

    // Ordenamos por orden
    const imagenesOrdenadas = auto.imagenes.sort((a, b) => a.orden - b.orden);
    return imagenesOrdenadas;
  }
}

module.exports = new AutoService();
