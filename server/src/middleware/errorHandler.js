const { env } = require("../config/env");

function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  if (env.NODE_ENV !== "production") {
    return res.status(status).json({
      error: err.message || "Server error",
      stack: err.stack
    });
  }

  // Production: don’t leak internals
  return res.status(status).json({
    error: status >= 500 ? "Server error" : err.message
  });
}

module.exports = { errorHandler };