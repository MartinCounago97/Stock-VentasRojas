const mongoose = require("mongoose");

const MovimientoStockSchema = new mongoose.Schema(
  {
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Producto",
      required: true,
      index: true,
    },

    tipo: {
      type: String,
      enum: ["ingreso", "venta", "ajuste"],
      required: true,
      index: true,
    },

    // positivo ingreso, negativo venta
    cantidad: { type: Number, required: true },

    observaciones: { type: String, default: "", trim: true },

    activo: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

MovimientoStockSchema.index({ productoId: 1, createdAt: -1 });

module.exports = mongoose.model("MovimientoStock", MovimientoStockSchema);
