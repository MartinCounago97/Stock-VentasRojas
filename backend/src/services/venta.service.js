const Venta = require("../models/venta.model");
const Producto = require("../models/producto.model");
const MovimientoStock = require("../models/movimientoStock.model");
const mongoose = require("mongoose");

function normalizeEnvio(payload = {}) {
  const envioIn = payload.envio || {};
  const tipo = envioIn.tipo || "retiro";

  const envio = {
    tipo,
    cedula: envioIn.cedula ? String(envioIn.cedula).trim() : undefined,
    nombre: envioIn.nombre ? String(envioIn.nombre).trim() : undefined,
    telefono: envioIn.telefono ? String(envioIn.telefono).trim() : undefined,
    localidad: envioIn.localidad ? String(envioIn.localidad).trim() : undefined,
    empresaEnvio: envioIn.empresaEnvio
      ? String(envioIn.empresaEnvio).trim()
      : undefined,
  };

  // ✅ si no es interior, limpiamos todo (evita basura guardada)
  if (tipo !== "interior") {
    envio.cedula = undefined;
    envio.nombre = undefined;
    envio.telefono = undefined;
    envio.localidad = undefined;
    envio.empresaEnvio = undefined;
  }

  return envio;
}

function validateEnvio(envio) {
  const allowed = ["retiro", "montevideo", "interior"];
  if (!allowed.includes(envio.tipo)) {
    const err = new Error("envio.tipo inválido");
    err.status = 400;
    throw err;
  }

  if (envio.tipo === "interior") {
    const requiredFields = [
      "cedula",
      "nombre",
      "telefono",
      "localidad",
      "empresaEnvio",
    ];
    const missing = requiredFields.filter((k) => !envio[k]);

    if (missing.length) {
      const err = new Error(
        `Faltan datos para envío al interior: ${missing.join(", ")}`
      );
      err.status = 400;
      throw err;
    }
  }
}

class VentaService {
  /* =====================================================
     CREAR (siempre PENDIENTE)
     - Se usa para "pedido desde catálogo web / wpp" y también para admin si querés.
     - NO descuenta stock.
  ===================================================== */
  async crearVenta(data) {
    const payload = data || {};

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      const err = new Error("La venta debe tener items");
      err.status = 400;
      throw err;
    }

    const origen = payload.origen || "admin";

    // ✅ NUEVO: envío
    const envio = normalizeEnvio(payload);
    validateEnvio(envio);

    // Armar items con snapshot desde Producto
    const items = [];
    for (const it of payload.items) {
      const productoId = it.productoId;
      const cantidad = Number(it.cantidad);

      if (!mongoose.Types.ObjectId.isValid(productoId)) {
        const err = new Error("productoId inválido");
        err.status = 400;
        throw err;
      }
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        const err = new Error("cantidad inválida (debe ser > 0)");
        err.status = 400;
        throw err;
      }

      const producto = await Producto.findById(productoId);
      if (!producto || producto.activo === false) {
        const err = new Error("Producto no encontrado");
        err.status = 404;
        throw err;
      }

      items.push({
        productoId: producto._id,
        nombreProducto: producto.nombre, // ✅ snapshot
        cantidad,
        precioUnitario: producto.precio,
        moneda: producto.moneda,
        subtotal: cantidad * producto.precio,
      });
    }

    const venta = await Venta.create({
      cliente: payload.cliente ?? "",
      origen,
      observacion: payload.observacion ?? "",
      estado: "pendiente",

      // ✅ NUEVO: guardamos envio
      envio,

      items,
      // el modelo recalcula total/moneda en pre("validate"), pero igual lo pasamos
      total: items.reduce((acc, x) => acc + x.subtotal, 0),
      moneda: items[0]?.moneda || "UYU",
      activo: true,
    });

    return venta;
  }

  async obtenerVentaPorId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error("ID inválido");
      err.status = 400;
      throw err;
    }

    const venta = await Venta.findById(id).populate("items.productoId");
    if (!venta) {
      const err = new Error("Venta no encontrada");
      err.status = 404;
      throw err;
    }

    return venta;
  }

  async listarVentas(filtros = {}) {
    const query = {};

    if (filtros.estado) query.estado = filtros.estado;
    if (filtros.origen) query.origen = filtros.origen;

    // ✅ NUEVO (opcional): filtrar por tipo de envio
    if (filtros.envioTipo) query["envio.tipo"] = filtros.envioTipo;

    if (filtros.q) {
      query.cliente = { $regex: String(filtros.q), $options: "i" };
    }

    const limit = filtros.limit ? Math.min(Number(filtros.limit), 200) : 50;

    const ventas = await Venta.find(query).sort({ createdAt: -1 }).limit(limit);

    return ventas;
  }

  /* =====================================================
     MODIFICAR (solo PENDIENTE)
     - Reconstuye items desde Producto (snapshot actualizado)
  ===================================================== */
  async actualizarVentaPendiente(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error("ID inválido");
      err.status = 400;
      throw err;
    }

    const venta = await Venta.findById(id);
    if (!venta) {
      const err = new Error("Venta no encontrada");
      err.status = 404;
      throw err;
    }

    if (venta.estado !== "pendiente") {
      const err = new Error("Solo se puede modificar una venta pendiente");
      err.status = 400;
      throw err;
    }

    const payload = data || {};

    if (payload.cliente !== undefined) venta.cliente = payload.cliente ?? "";
    if (payload.observacion !== undefined)
      venta.observacion = payload.observacion ?? "";
    if (payload.origen !== undefined) venta.origen = payload.origen ?? "admin";

    // ✅ NUEVO: actualizar envio si viene
    if (payload.envio !== undefined) {
      const envio = normalizeEnvio(payload);
      validateEnvio(envio);
      venta.envio = envio;
    }

    if (payload.items !== undefined) {
      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        const err = new Error("items inválidos");
        err.status = 400;
        throw err;
      }

      const items = [];
      for (const it of payload.items) {
        const productoId = it.productoId;
        const cantidad = Number(it.cantidad);

        if (!mongoose.Types.ObjectId.isValid(productoId)) {
          const err = new Error("productoId inválido");
          err.status = 400;
          throw err;
        }
        if (!Number.isFinite(cantidad) || cantidad <= 0) {
          const err = new Error("cantidad inválida (debe ser > 0)");
          err.status = 400;
          throw err;
        }

        const producto = await Producto.findById(productoId);
        if (!producto || producto.activo === false) {
          const err = new Error("Producto no encontrado");
          err.status = 404;
          throw err;
        }

        items.push({
          productoId: producto._id,
          nombreProducto: producto.nombre, // ✅ snapshot
          cantidad,
          precioUnitario: producto.precio,
          moneda: producto.moneda,
          subtotal: cantidad * producto.precio,
        });
      }

      venta.items = items;
    }

    await venta.save();
    return venta;
  }

  /* =====================================================
     CONFIRMAR (pendiente -> confirmada)
     - Valida stock
     - Descuenta stock
     - Crea movimientos (cantidad negativa)
     - Transacción (todo o nada)
  ===================================================== */
  async confirmarVenta(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error("ID inválido");
      err.status = 400;
      throw err;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const venta = await Venta.findById(id).session(session);
      if (!venta) {
        const err = new Error("Venta no encontrada");
        err.status = 404;
        throw err;
      }

      if (venta.estado !== "pendiente") {
        const err = new Error(
          "Solo se pueden confirmar ventas en estado pendiente"
        );
        err.status = 400;
        throw err;
      }

      // 1) Validar stock suficiente
      for (const it of venta.items) {
        const producto = await Producto.findById(it.productoId).session(
          session
        );

        if (!producto || producto.activo === false) {
          const err = new Error("Producto no encontrado");
          err.status = 404;
          throw err;
        }

        if (producto.stock < it.cantidad) {
          const err = new Error(
            `Stock insuficiente para "${producto.nombre}" (stock: ${producto.stock}, requerido: ${it.cantidad})`
          );
          err.status = 400;
          throw err;
        }
      }

      // 2) Descontar stock + movimientos
      for (const it of venta.items) {
        const producto = await Producto.findById(it.productoId).session(
          session
        );

        producto.stock = producto.stock - it.cantidad;
        await producto.save({ session });

        await MovimientoStock.create(
          [
            {
              productoId: producto._id,
              tipo: "venta",
              cantidad: -Math.abs(it.cantidad),
              observaciones: `Venta confirmada${
                venta.cliente ? ` (${venta.cliente})` : ""
              }`,
              activo: true,
            },
          ],
          { session }
        );
      }

      // 3) Cambiar estado
      venta.estado = "confirmada";
      await venta.save({ session });

      await session.commitTransaction();
      session.endSession();

      return venta;
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  /* =====================================================
     RECHAZAR (pendiente -> rechazada)
     - No toca stock
  ===================================================== */
  async rechazarVenta(id, motivo = "") {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error("ID inválido");
      err.status = 400;
      throw err;
    }

    const venta = await Venta.findById(id);
    if (!venta) {
      const err = new Error("Venta no encontrada");
      err.status = 404;
      throw err;
    }

    if (venta.estado !== "pendiente") {
      const err = new Error(
        "Solo se pueden rechazar ventas en estado pendiente"
      );
      err.status = 400;
      throw err;
    }

    venta.estado = "rechazada";

    if (motivo) {
      venta.observacion = venta.observacion
        ? `${venta.observacion}\nRechazo: ${motivo}`
        : `Rechazo: ${motivo}`;
    }

    await venta.save();
    return venta;
  }
}

module.exports = new VentaService();
