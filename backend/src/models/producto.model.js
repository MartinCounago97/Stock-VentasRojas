const mongoose = require("mongoose");
const Ubicacion = require("./ubicacion.model");

const FotoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
  },
  { _id: false }
);

const ProductoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, index: true },
    descripcion: { type: String, default: "", trim: true },

    foto: { type: FotoSchema, default: null },

    precio: { type: Number, required: true, min: 0, index: true },

    moneda: {
      type: String,
      enum: ["USD", "UYU"],
      default: "UYU",
      required: true,
      index: true,
    },

    stock: { type: Number, required: true, min: 0, default: 0, index: true },

    stockMinimo: { type: Number, min: 0, index: true },

    ubicacionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ubicacion",
      index: true,
    },

    activo: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Defaults
ProductoSchema.pre("save", async function () {
  // 1) stockMinimo default
  const defaultMin = Number(process.env.DEFAULT_STOCK_MINIMO ?? 0);
  if (this.stockMinimo === undefined || this.stockMinimo === null) {
    this.stockMinimo = Number.isFinite(defaultMin) ? defaultMin : 0;
  }

  // 2) ubicacion por defecto SOLO al crear
  if (this.isNew && !this.ubicacionId) {
    const sector = "AUN A DEFINIR";
    const codigo = "SIN-UBICACION";
    const key = `${sector}-${codigo}`.toLowerCase();

    let u = await Ubicacion.findOne({ key });

    if (!u) {
      try {
        u = await Ubicacion.create({
          sector,
          codigo,
          descripcion: "Ubicación por defecto",
          activo: true,
          key,
        });
      } catch (e) {
        // carrera: si otro request la creó justo antes
        u = await Ubicacion.findOne({ key });
      }
    }

    this.ubicacionId = u._id;
  }
});

module.exports = mongoose.model("Producto", ProductoSchema);
