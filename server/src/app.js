const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");

const { env } = require("./config/env");
const { apiRouter } = require("./routes");
const { errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();

  app.set("trust proxy", 1); // important on Render

  app.use(helmet());
  app.use(
  compression({
    filter: (req, res) => {
      const accept = req.headers.accept || "";
      if (accept.includes("text/event-stream")) return false;
      return compression.filter(req, res);
    }
  })
);
  app.use(express.json({ limit: "20kb" }));
  app.use(cookieParser());

  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  }

  // Rate limit (public endpoints safety baseline)
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  // API routes FIRST (so SPA fallback never breaks /api)
  app.use("/api", apiRouter);

  // Serve React build in production (same-origin => no route/API mismatch)
  if (env.NODE_ENV === "production") {
    const clientDistPath = path.join(__dirname, "..", "..", "client", "dist");
    app.use(express.static(clientDistPath));

    // SPA fallback (but excludes /api because /api is mounted above)
    app.get("*", (req, res) => {
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  }

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };