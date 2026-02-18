module.exports = function adminAuth(req, res, next) {
  const password = req.headers["x-admin-password"];

  if (!password) {
    return res.status(401).json({ error: "Acceso no autorizado" });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Password incorrecta" });
  }

  next();
};
