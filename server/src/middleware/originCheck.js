const { env } = require("../config/env");

function getAllowedOrigins() {
  const list = ["http://localhost:5173"];
  if (process.env.APP_URL) list.push(process.env.APP_URL);
  return list;
}

function originCheck(req, res, next) {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return next();

  const origin = req.headers.origin;

  if (!origin) {
    if (env.NODE_ENV !== "production") return next();
    return next();
  }

  if (!getAllowedOrigins().includes(origin)) {
    return res.status(403).json({ error: "Blocked by origin policy" });
  }
  next();
}

module.exports = { originCheck };