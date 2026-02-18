const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

const { connectToMongo } = require("./config/mongoConfig");

// Conectamos a Mongo
connectToMongo();

// ✅ CORS (si usás credentials: true, origin NO puede ser "*")
const corsOptions = {
  origin: ["http://localhost:3000", "http://192.168.0.50:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-password"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Servir archivos estáticos (IMÁGENES)
// app.js está en backend/src => ".." apunta a backend
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ✅ Healthcheck
app.get("/health", (req, res) =>
  res.json({ ok: true, name: "StockVentasRojas" })
);

// ✅ Rutas API
app.use("/api/productos", require("./routes/producto.controller"));
app.use("/api/ventas", require("./routes/venta.controller"));
app.use("/api/ubicaciones", require("./routes/ubicacion.controller"));

// Home
app.get("/", (req, res) => {
  res.send("STOCK ROJAS funcionando");
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;

  // Si en el futuro usás Zod/Joi, acá podés mapear errores de validación
  res.status(status).json({
    error: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
