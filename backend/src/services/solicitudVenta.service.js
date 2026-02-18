const SolicitudVenta = require("../models/solicitud-venta.model");
const Auto = require("../models/auto.model");
const AutoService = require("../services/auto.service");

const mongoose = require("mongoose");

const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs-extra");

// ✅ service está en backend/src/services
// subimos imágenes a backend/uploads/solicitudes
const UPLOAD_DIR_SOL = path.resolve(
  __dirname,
  "..",
  "..",
  "uploads",
  "solicitudes"
);

const UPLOAD_DIR_AUTOS = path.resolve(
  __dirname,
  "..",
  "..",
  "uploads",
  "autos"
);

function normalizeCombustible(v) {
  if (!v) return "nafta";
  const s = String(v).toLowerCase().trim();
  if (s.includes("diesel")) return "diesel";
  if (s.includes("hibr")) return "hibrido";
  if (s.includes("elect")) return "electrico";
  return "nafta";
}

function normalizeTransmision(v) {
  if (!v) return "manual";
  const s = String(v).toLowerCase().trim();
  if (s.includes("auto")) return "automatica";
  return "manual";
}

async function ensureDir(dir) {
  await fs.ensureDir(dir);
}

// copia archivos de uploads/solicitudes -> uploads/autos y arma el array para Auto.imagenes
async function buildAutoImagesFromSolicitud(imagenesSolicitud = []) {
  await ensureDir(UPLOAD_DIR_AUTOS);

  const result = [];

  for (let i = 0; i < imagenesSolicitud.length; i++) {
    const img = imagenesSolicitud[i];
    if (!img?.filename) continue;

    const from = path.join(UPLOAD_DIR_SOL, img.filename);
    const to = path.join(UPLOAD_DIR_AUTOS, img.filename);

    // si existe ya, no re-copies
    const exists = await fs.pathExists(to);
    if (!exists) {
      // si el archivo origen no existe, evitamos romper todo
      const fromExists = await fs.pathExists(from);
      if (fromExists) {
        await fs.copy(from, to);
      } else {
        // si no existe, simplemente lo salteamos
        continue;
      }
    }

    result.push({
      url: `/uploads/autos/${img.filename}`,
      filename: img.filename,
      principal: i === 0,
      orden: i,
    });
  }

  return result;
}

function toNumberOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

class SolicitudVentaService {
  async crearSolicitud(data) {
    const payload = {
      ...data,
      combustible: normalizeCombustible(data.combustible),
      transmision: normalizeTransmision(data.transmision),
    };

    const solicitud = await SolicitudVenta.create(payload);
    return solicitud;
  }

  async obtenerSolicitudPorId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error("ID inválido");
      err.status = 400;
      throw err;
    }

    const solicitud = await SolicitudVenta.findById(id);
    if (!solicitud) {
      const err = new Error("Solicitud no encontrada");
      err.status = 404;
      throw err;
    }

    return solicitud;
  }

  async listarSolicitudes(filtros = {}) {
    const query = {};

    if (filtros.estado) query.estado = filtros.estado;
    if (filtros.marca) query.marca = filtros.marca;
    if (filtros.modelo) query.modelo = filtros.modelo;

    if (filtros.fechaDesde || filtros.fechaHasta) {
      query.createdAt = {};
      if (filtros.fechaDesde)
        query.createdAt.$gte = new Date(filtros.fechaDesde);
      if (filtros.fechaHasta)
        query.createdAt.$lte = new Date(filtros.fechaHasta);
    }

    return SolicitudVenta.find(query).sort({ createdAt: -1 });
  }

  /**
   * Construye el payload del auto a partir de la solicitud.
   * Valida mínimos necesarios para que el AutoSchema no explote con requireds.
   */
  async _buildAutoPayloadFromSolicitud(solicitud) {
    const anio = toNumberOrNull(solicitud.anio);
    const kilometros = toNumberOrNull(solicitud.kilometros);
    const precio = toNumberOrNull(solicitud.precioPretendido);

    // ✅ Validaciones mínimas (ajustá según tus required reales del AutoSchema)
    if (!solicitud.marca) throw badRequest("La solicitud no tiene marca.");
    if (!solicitud.modelo) throw badRequest("La solicitud no tiene modelo.");
    if (!anio || anio <= 1900)
      throw badRequest("La solicitud no tiene anio válido.");
    if (kilometros === null || kilometros < 0)
      throw badRequest("La solicitud no tiene kilometros válidos.");
    if (!precio || precio <= 0)
      throw badRequest("La solicitud no tiene precioPretendido válido.");

    const imagenesAuto = await buildAutoImagesFromSolicitud(
      solicitud.imagenes || []
    );

    return {
      marca: solicitud.marca,
      modelo: solicitud.modelo,
      version: solicitud.version || "",
      anio,
      kilometros,
      precio,
      moneda: solicitud.moneda || "USD",
      descripcion: solicitud.descripcion || "",
      combustible: normalizeCombustible(solicitud.combustible),
      transmision: normalizeTransmision(solicitud.transmision),
      color: solicitud.color || "",
      imagenes: imagenesAuto, // puede ser [] y está OK
      destacado: false,
      estado: "disponible",
      activo: true,
    };
  }

  async cambiarEstado(id, estado) {
    const estadosValidos = ["pendiente", "contactado", "aprobado", "rechazado"];

    if (!estadosValidos.includes(estado)) {
      const err = new Error("Estado inválido");
      err.status = 400;
      throw err;
    }

    const solicitud = await SolicitudVenta.findById(id);
    if (!solicitud) {
      const err = new Error("Solicitud no encontrada");
      err.status = 404;
      throw err;
    }

    // ✅ Si pasa a aprobado -> crear auto SOLO si no existe todavía
    if (estado === "aprobado") {
      let autoExiste = false;

      if (
        solicitud.autoId &&
        mongoose.Types.ObjectId.isValid(solicitud.autoId)
      ) {
        const auto = await Auto.findById(solicitud.autoId);
        autoExiste = !!auto;
      }

      // Caso 1: ya existe un auto asociado => NO crear de nuevo
      if (autoExiste) {
        // opcional: podrías sincronizar imágenes/datos acá si querés
        // pero por pedido: solo evitar duplicados
      } else {
        // Caso 2: no hay auto asociado, o estaba asociado pero ya no existe en DB => crear
        const autoPayload = await this._buildAutoPayloadFromSolicitud(
          solicitud
        );
        const autoCreado = await AutoService.crearAuto(autoPayload);
        solicitud.autoId = autoCreado._id;
      }
    }

    solicitud.estado = estado;
    await solicitud.save();

    return solicitud;
  }

  async agregarNotaInterna(id, nota) {
    if (!nota || typeof nota !== "string") {
      const err = new Error("Nota inválida");
      err.status = 400;
      throw err;
    }

    const clean = nota.trim();
    if (!clean) {
      const err = new Error("Nota vacía");
      err.status = 400;
      throw err;
    }

    const solicitud = await SolicitudVenta.findByIdAndUpdate(
      id,
      { $push: { notasInternas: clean } },
      { new: true }
    );

    if (!solicitud) {
      const err = new Error("Solicitud no encontrada");
      err.status = 404;
      throw err;
    }

    return solicitud;
  }

  async eliminarNotaInterna(id, index) {
    const idx = Number(index);
    if (Number.isNaN(idx) || idx < 0) {
      const err = new Error("Índice inválido");
      err.status = 400;
      throw err;
    }

    const solicitud = await SolicitudVenta.findById(id);
    if (!solicitud) {
      const err = new Error("Solicitud no encontrada");
      err.status = 404;
      throw err;
    }

    const notas = solicitud.notasInternas || [];
    if (idx >= notas.length) {
      const err = new Error("Índice fuera de rango");
      err.status = 400;
      throw err;
    }

    notas.splice(idx, 1);
    solicitud.notasInternas = notas;
    await solicitud.save();

    return solicitud;
  }

  async eliminarSolicitud(id) {
    const solicitud = await SolicitudVenta.findById(id);
    if (!solicitud) {
      const err = new Error("Solicitud no encontrada");
      err.status = 404;
      throw err;
    }

    // 🔥 borrar imágenes físicas
    if (solicitud.imagenes?.length) {
      for (const img of solicitud.imagenes) {
        if (img.filename) {
          await fs.remove(path.join(UPLOAD_DIR_SOL, img.filename));
        }
      }
    }

    await SolicitudVenta.findByIdAndDelete(id);
    return true;
  }

  async _ensureUploadDir() {
    await fs.ensureDir(UPLOAD_DIR_SOL);
  }

  _buildUrl(filename) {
    return `/uploads/solicitudes/${filename}`;
  }

  async _saveImage(file) {
    await this._ensureUploadDir();

    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(UPLOAD_DIR_SOL, filename);

    await sharp(file.buffer)
      .resize({ width: 1600 })
      .webp({ quality: 80 })
      .toFile(filepath);

    return { filename, url: this._buildUrl(filename) };
  }

  // ✅ SUBIR MULTIPLES IMÁGENES (USUARIO)
  async subirMultiplesImagenes(solicitudId, files) {
    const solicitud = await SolicitudVenta.findById(solicitudId);
    if (!solicitud) {
      const err = new Error("Solicitud no encontrada");
      err.status = 404;
      throw err;
    }

    for (const file of files) {
      const image = await this._saveImage(file);

      solicitud.imagenes.push({
        url: image.url,
        filename: image.filename,
      });
    }

    await solicitud.save();
    return solicitud;
  }

  // ✅ BORRAR IMAGEN POR URL (ADMIN)
  async borrarImagenPorUrl(solicitudId, url) {
    if (!url || typeof url !== "string") {
      const err = new Error("Falta el campo url");
      err.status = 400;
      throw err;
    }

    const solicitud = await SolicitudVenta.findById(solicitudId);
    if (!solicitud) {
      const err = new Error("Solicitud no encontrada");
      err.status = 404;
      throw err;
    }

    const idx = solicitud.imagenes.findIndex((img) => img.url === url);
    if (idx === -1) {
      const err = new Error("Imagen no encontrada");
      err.status = 404;
      throw err;
    }

    const img = solicitud.imagenes[idx];

    // borrar archivo físico
    if (img.filename) {
      await fs.remove(path.join(UPLOAD_DIR_SOL, img.filename));
    }

    // quitar de DB
    solicitud.imagenes.splice(idx, 1);
    await solicitud.save();

    return solicitud;
  }

  // ✅ LISTAR IMÁGENES (ADMIN/USUARIO)
  async obtenerImagenes(solicitudId) {
    if (!mongoose.Types.ObjectId.isValid(solicitudId)) {
      const err = new Error("ID inválido");
      err.status = 400;
      throw err;
    }

    const solicitud = await SolicitudVenta.findById(solicitudId).select(
      "imagenes"
    );
    if (!solicitud) {
      const err = new Error("Solicitud no encontrada");
      err.status = 404;
      throw err;
    }

    return solicitud.imagenes;
  }
}

module.exports = new SolicitudVentaService();
