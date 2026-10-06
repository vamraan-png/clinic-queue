const { verifyAuthToken } = require("../lib/jwt");
const { HttpError } = require("../lib/httpError");
const { User } = require("../models/User.model");

const COOKIE_NAME = "cq_token";

async function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next(new HttpError(401, "Not authenticated"));

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    return next(new HttpError(401, "Invalid session"));
  }

  const user = await User.findById(payload.sub).select("_id name email role isActive");
  if (!user || !user.isActive) return next(new HttpError(401, "Account disabled"));

  req.user = user;
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, "Not authenticated"));
    if (!allowedRoles.includes(req.user.role)) return next(new HttpError(403, "Forbidden"));
    next();
  };
}

module.exports = { requireAuth, requireRole, COOKIE_NAME };