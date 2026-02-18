const mongoose = require("mongoose");

const VentaItemSchema = new mongoose.Schema(
  {
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Producto",
      required: true,
      index: true,
    },

    nombreProducto: { type: String, required: true, trim: true },

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
    cliente: { type: String, default: "", trim: true },

    origen: {
      type: String,
      enum: ["admin", "catalogo_web", "whatsapp"],
      default: "admin",
      index: true,
    },

    observacion: { type: String, default: "", trim: true },

    items: { type: [VentaItemSchema], required: true, default: [] },

    total: { type: Number, required: true, min: 0, index: true },

    moneda: {
      type: String,
      enum: ["USD", "UYU"],
      required: true,
      default: "UYU",
      index: true,
    },

    estado: {
      type: String,
      enum: ["pendiente", "confirmada", "rechazada", "anulada"],
      default: "pendiente",
      index: true,
    },

    activo: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// 🔥 Hook moderno (sin next)
VentaSchema.pre("validate", function () {
  if (!this.items || this.items.length === 0) {
    throw new Error("La venta debe tener al menos un item");
  }

  const moneda = this.items[0].moneda;

  const mezcla = this.items.some((i) => i.moneda !== moneda);
  if (mezcla) {
    const err = new Error("No se permite mezclar monedas en una venta");
    err.status = 400;
    throw err;
  }

  this.moneda = moneda;

  let total = 0;

  for (const item of this.items) {
    item.subtotal = item.cantidad * item.precioUnitario;
    total += item.subtotal;
  }

  this.total = total;
});

module.exports = mongoose.model("Venta", VentaSchema);
