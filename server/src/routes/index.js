const express = require("express");
const { healthRouter } = require("./health.routes");
const { authRouter } = require("./auth.routes");
const { adminRouter } = require("./admin.routes");
const { publicRouter } = require("./public.routes");
const { HttpError } = require("../lib/httpError");

const apiRouter = express.Router();

apiRouter.use(healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/public", publicRouter);

// API-only 404 (important: React SPA fallback is handled in app.js in production)
apiRouter.use((req, res, next) => next(new HttpError(404, "API route not found")));

module.exports = { apiRouter };