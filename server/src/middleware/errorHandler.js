const { env } = require("../config/env");

function errorHandler(err, req, res, next) {
  // Mongoose invalid ObjectId cast
  if (err?.name === "CastError") {
    return res.status(400).json({ error: "Invalid id format" });
  }

  // Mongo duplicate key (unique index) e.g. doctor code already exists
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({ error: `Duplicate value for ${field}` });
  }

  const status = err.status || 500;

  if (env.NODE_ENV !== "production") {
    return res.status(status).json({
      error: err.message || "Server error",
      stack: err.stack
    });
  }

  return res.status(status).json({
    error: status >= 500 ? "Server error" : err.message
  });
}

module.exports = { errorHandler };