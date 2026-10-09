const { AuditEvent } = require("../models/AuditEvent.model");

function pickIp(req) {
  // trust proxy is enabled, so x-forwarded-for works on Render
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || "";
}

async function logAudit(req, { action, entityType, entityId, doctorId, dateKey, meta }) {
  const user = req.user;

  return AuditEvent.create({
    actorId: user?._id,
    actorEmail: user?.email,
    actorRole: user?.role,
    action,
    entityType,
    entityId,
    doctorId,
    dateKey,
    meta: meta || {},
    ip: pickIp(req),
    userAgent: req.headers["user-agent"] || ""
  });
}

module.exports = { logAudit };