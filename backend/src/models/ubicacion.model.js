const mongoose = require("mongoose");

const UbicacionSchema = new mongoose.Schema(
  {
    sector: { type: String, required: true, trim: true, index: true },
    codigo: { type: String, required: true, trim: true, index: true },
    descripcion: { type: String, default: "", trim: true },

    activo: { type: Boolean, default: true, index: true },

    key: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Genera key automáticamente
UbicacionSchema.pre("validate", function (next) {
  const sector = (this.sector || "").trim();
  const codigo = (this.codigo || "").trim();

  if (sector && codigo) {
    this.key = `${sector}-${codigo}`.toLowerCase();
  }

  next();
});

module.exports = mongoose.model("Ubicacion", UbicacionSchema);
