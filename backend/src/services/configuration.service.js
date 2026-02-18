const mongoose = require("mongoose");
const { Configuration } = require("../models/configuration-model");

const NotFoundError = require("../exceptions/NotFoundError");
const BaseError = require("../exceptions/BaseError");
const { connectToMongo } = require("../config/mongoConfig");

class ConfigurationService {
  constructor() {
    connectToMongo();
    this.Configuration = Configuration;
  }

  async getConfiguration() {
    const config = await this.Configuration.findOne().lean();
    return config; // puede ser null si no existe aún
  }

  async upsertConfiguration(payload) {
    const data = this._sanitizePayload(payload);

    const updated = await this.Configuration.findOneAndUpdate(
      {},
      { $set: data },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).lean();

    return updated;
  }

  _sanitizePayload(payload) {
    if (!payload || typeof payload !== "object") {
      throw new BaseError("Body inválido.");
    }

    const out = {};

    // Recepción pedidos
    if (payload.ordersEnabled !== undefined) {
      out.ordersEnabled = Boolean(payload.ordersEnabled);
    }

    // Info local
    if (payload.businessName !== undefined) {
      const v = String(payload.businessName || "").trim();
      if (!v) throw new BaseError("businessName es requerido.");
      out.businessName = v;
    }

    if (payload.businessAddress !== undefined) {
      const v = String(payload.businessAddress || "").trim();
      if (!v) throw new BaseError("businessAddress es requerido.");
      out.businessAddress = v;
    }

    if (payload.businessPhones !== undefined) {
      if (
        !Array.isArray(payload.businessPhones) ||
        payload.businessPhones.length === 0
      ) {
        throw new BaseError("businessPhones debe ser un array no vacío.");
      }

      out.businessPhones = payload.businessPhones.map((p) => {
        const phone = String(p || "").trim();
        if (!phone) throw new BaseError("Teléfono inválido.");
        return phone;
      });
    }

    if (payload.businessEmail !== undefined) {
      const v = String(payload.businessEmail || "").trim();
      if (!v.includes("@")) throw new BaseError("businessEmail inválido.");
      out.businessEmail = v;
    }

    // Horarios
    if (payload.businessHours !== undefined) {
      if (!Array.isArray(payload.businessHours)) {
        throw new BaseError("businessHours debe ser un array.");
      }

      out.businessHours = payload.businessHours.map((h) => {
        if (!h.day || !h.openTime || !h.closeTime) {
          throw new BaseError("Horario inválido.");
        }

        return {
          day: String(h.day).trim(),
          openTime: String(h.openTime).trim(),
          closeTime: String(h.closeTime).trim(),
          active: h.active !== undefined ? Boolean(h.active) : true,
        };
      });
    }

    // Bloqueo fuera de horario
    if (payload.blockOutsideHours !== undefined) {
      out.blockOutsideHours = Boolean(payload.blockOutsideHours);
    }

    // Máx pedidos por franja
    if (payload.maxOrdersPerSlot !== undefined) {
      const n = Number(payload.maxOrdersPerSlot);
      if (!Number.isFinite(n) || n < 1) {
        throw new BaseError("maxOrdersPerSlot inválido.");
      }
      out.maxOrdersPerSlot = n;
    }

    // Opciones de entrega
    if (payload.pickupEnabled !== undefined) {
      out.pickupEnabled = Boolean(payload.pickupEnabled);
    }

    if (payload.deliveryEnabled !== undefined) {
      out.deliveryEnabled = Boolean(payload.deliveryEnabled);
    }

    // Monto mínimo envío
    if (payload.minimumDeliveryAmount !== undefined) {
      const n = Number(payload.minimumDeliveryAmount);
      if (!Number.isFinite(n) || n < 0) {
        throw new BaseError("minimumDeliveryAmount inválido.");
      }
      out.minimumDeliveryAmount = n;
    }

    return out;
  }
}

module.exports = ConfigurationService;
