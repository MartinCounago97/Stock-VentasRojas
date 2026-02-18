const Ubicacion = require("../models/ubicacion.model");
const mongoose = require("mongoose");

class UbicacionService {
  async crearUbicacion(data) {
    const payload = {
      sector: data?.sector,
      codigo: data?.codigo,
      descripcion: data?.descripcion ?? "",
      activo:
        typeof data?.activo === "boolean"
          ? data.activo
          : data?.activo === "true"
          ? true
          : data?.activo === "false"
          ? false
          : undefined,
    };

    try {
      const ubicacion = await Ubicacion.create(payload);
      return ubicacion;
    } catch (e) {
      // duplicate key (key unique)
      if (e?.code === 11000) {
        const err = new Error("La ubicación ya existe (sector + código)");
        err.status = 400;
        throw err;
      }
      throw e;
    }
  }

  async obtenerUbicacionPorId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error("ID inválido");
      err.status = 400;
      throw err;
    }

    const ubicacion = await Ubicacion.findById(id);
    if (!ubicacion) {
      const err = new Error("Ubicación no encontrada");
      err.status = 404;
      throw err;
    }

    return ubicacion;
  }

  async listarUbicaciones(filtros = {}) {
    const query = {};

    if (typeof filtros.activo !== "undefined") {
      query.activo = filtros.activo === "true" || filtros.activo === true;
    }

    if (filtros.sector) {
      query.sector = { $regex: String(filtros.sector), $options: "i" };
    }

    if (filtros.q) {
      // búsqueda general por sector o codigo
      query.$or = [
        { sector: { $regex: String(filtros.q), $options: "i" } },
        { codigo: { $regex: String(filtros.q), $options: "i" } },
      ];
    }

    const ubicaciones = await Ubicacion.find(query).sort({
      sector: 1,
      codigo: 1,
    });

    return ubicaciones;
  }

  async actualizarUbicacion(id, data) {
    const payload = {
      sector: data?.sector,
      codigo: data?.codigo,
      descripcion: data?.descripcion,
      activo:
        typeof data?.activo === "boolean"
          ? data.activo
          : data?.activo === "true"
          ? true
          : data?.activo === "false"
          ? false
          : undefined,
    };

    try {
      const ubicacion = await Ubicacion.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
      });

      if (!ubicacion) {
        const err = new Error("Ubicación no encontrada");
        err.status = 404;
        throw err;
      }

      return ubicacion;
    } catch (e) {
      if (e?.code === 11000) {
        const err = new Error("La ubicación ya existe (sector + código)");
        err.status = 400;
        throw err;
      }
      throw e;
    }
  }

  async eliminarUbicacion(id) {
    const ubicacion = await Ubicacion.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!ubicacion) {
      const err = new Error("Ubicación no encontrada");
      err.status = 404;
      throw err;
    }

    return true;
  }
}

module.exports = new UbicacionService();
