const express = require("express");
const { healthRouter } = require("./health.routes");
const { authRouter } = require("./auth.routes");
const { adminRouter } = require("./admin.routes");
const { publicRouter } = require("./public.routes");

const apiRouter = express.Router();

apiRouter.use(healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/public", publicRouter);

module.exports = { apiRouter };