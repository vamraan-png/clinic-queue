const express = require("express");

const { healthRouter } = require("./health.routes");
const { authRouter } = require("./auth.routes");
const { adminRouter } = require("./admin.routes");
const { publicRouter } = require("./public.routes");
const { auditRouter } = require("./audit.routes");

const { HttpError } = require("../lib/httpError");

const apiRouter = express.Router();

apiRouter.use(healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/public", publicRouter);

// Owner-only audit logs
apiRouter.use("/audit-logs", auditRouter);

// API-only 404
apiRouter.use((req, res, next) =>
  next(new HttpError(404, "API route not found"))
);

module.exports = { apiRouter };