const mongoose = require("mongoose");

exports.connectToMongo = async () => {
  try {
    const uri = process.env.DB_CONNECTION_STRING;

    if (!uri) {
      throw new Error("Falta DB_CONNECTION_STRING en el .env");
    }

    await mongoose.connect(uri);

    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  }
};
