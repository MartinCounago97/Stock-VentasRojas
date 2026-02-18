const mongoose = require("mongoose");

const VentaItemSchema = new mongoose.Schema(
  {
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Producto",
      required: true,
      index: true,
    },

    nombre: { type: String, required: true, trim: true },

    cantidad: { type: Number, required: true, min: 1 },

    precioUnitario: { type: Number, required: true, min: 0 },

    moneda: {
      type: String,
      enum: ["USD", "UYU"],
      required: true,
    },

    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const VentaSchema = new mongoose.Schema(
  {
    items: { type: [VentaItemSchema], required: true, default: [] },

    total: { type: Number, required: true, min: 0, index: true },

    moneda: {
      type: String,
      enum: ["USD", "UYU"],
      required: true,
      default: "UYU",
      index: true,
    },

    nota: { type: String, default: "", trim: true },

    estado: {
      type: String,
      enum: ["confirmada", "anulada"],
      default: "confirmada",
      index: true,
    },

    activo: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Recalcula total automáticamente
VentaSchema.pre("validate", function (next) {
  try {
    if (this.items && this.items.length > 0) {
      const moneda = this.items[0].moneda;

      const mezcla = this.items.some((i) => i.moneda !== moneda);
      if (mezcla) {
        const err = new Error("No se permite mezclar monedas en una venta");
        err.status = 400;
        return next(err);
      }

      this.moneda = moneda;

      let total = 0;
      for (const item of this.items) {
        item.subtotal = item.cantidad * item.precioUnitario;
        total += item.subtotal;
      }

      this.total = total;
    }

    next();
  } catch (e) {
    next(e);
  }
});

module.exports = mongoose.model("Venta", VentaSchema);
