const Ubicacion = require("../models/ubicacion.model");
const Producto = require("../models/producto.model");

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

  async obtenerEstructura(filtros = {}) {
    const incluirInactivos =
      filtros.incluirInactivos === true || filtros.incluirInactivos === "true";

    const matchUbicaciones = incluirInactivos ? {} : { activo: true };

    const pipeline = [
      { $match: matchUbicaciones },

      // join: trae productos en esa ubicacion
      {
        $lookup: {
          from: "productos", // <- colección de Producto (Mongoose pluraliza a "productos")
          localField: "_id",
          foreignField: "ubicacionId",
          as: "productos",
          pipeline: [
            { $match: { activo: true } },
            {
              $project: {
                _id: 1,
                nombre: 1,
                stock: 1,
                stockMinimo: 1,
                precio: 1,
                moneda: 1,
                foto: 1,
                ubicacionId: 1,
              },
            },
            { $sort: { nombre: 1 } },
          ],
        },
      },

      // contar productos por posición
      {
        $addFields: {
          productosCount: { $size: "$productos" },
        },
      },

      // ordenar posiciones dentro del sector por codigo
      { $sort: { sector: 1, codigo: 1 } },

      // agrupar por sector
      {
        $group: {
          _id: "$sector",
          posiciones: {
            $push: {
              _id: "$_id",
              codigo: "$codigo",
              descripcion: "$descripcion",
              activo: "$activo",
              productosCount: "$productosCount",
              productos: "$productos",
            },
          },
          posicionesCount: { $sum: 1 },
          productosCount: { $sum: "$productosCount" },
        },
      },

      // forma final
      {
        $project: {
          _id: 0,
          sector: "$_id",
          posiciones: 1,
          posicionesCount: 1,
          productosCount: 1,
        },
      },

      { $sort: { sector: 1 } },
    ];

    return await Ubicacion.aggregate(pipeline);
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error("ID inválido");
      err.status = 400;
      throw err;
    }

    // 1) buscar ubicación
    const ubicacion = await Ubicacion.findById(id);
    if (!ubicacion) {
      const err = new Error("Ubicación no encontrada");
      err.status = 404;
      throw err;
    }

    // 2) marcar inactiva
    ubicacion.activo = false;
    await ubicacion.save();

    // 3) conseguir/crear ubicación default
    const sector = "AUN A DEFINIR";
    const codigo = "SIN-UBICACION";
    const key = `${sector}-${codigo}`.toLowerCase();

    let uDefault = await Ubicacion.findOne({ key });
    if (!uDefault) {
      try {
        uDefault = await Ubicacion.create({
          sector,
          codigo,
          descripcion: "Ubicación por defecto",
          activo: true,
          key,
        });
      } catch (e) {
        // por carrera si otra request la creó
        uDefault = await Ubicacion.findOne({ key });
      }
    }

    if (!uDefault) {
      const err = new Error("No se pudo obtener la ubicación por defecto");
      err.status = 500;
      throw err;
    }

    // 4) reasignar productos que estaban en esta ubicación
    await Producto.updateMany(
      { ubicacionId: ubicacion._id },
      { $set: { ubicacionId: uDefault._id } }
    );

    return true;
  }
}

module.exports = new UbicacionService();
