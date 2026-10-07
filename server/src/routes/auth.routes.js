const express = require("express");
const { z } = require("zod");
const { events } = require("../lib/events");
const { sendSms } = require("../services/sms.service");
const { asyncHandler } = require("../lib/asyncHandler");
const { HttpError } = require("../lib/httpError");
const { User } = require("../models/User.model");
const { signAuthToken } = require("../lib/jwt");
const { COOKIE_NAME } = require("../middleware/auth");
const { env } = require("../config/env");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(72)
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid login data");

    const { email, password } = parsed.data;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) throw new HttpError(401, "Invalid credentials");

    const ok = await user.verifyPassword(password);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    const token = signAuthToken({ sub: user._id.toString(), role: user.role });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/"
    });

    res.json({
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword
  }
});
  })
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.json({ ok: true });
  })
);

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    // optional endpoint for frontend to check session quickly
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(200).json({ user: null });

    try {
      const payload = require("../lib/jwt").verifyAuthToken(token);
      const user = await User.findById(payload.sub).select("_id name email role isActive mustChangePassword")
      if (!user || !user.isActive) return res.json({ user: null });

      res.json({
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword
  }
});
    } catch {
      return res.json({ user: null });
    }
  })
);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(72),
  newPassword: z.string().min(10).max(72)
});

router.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid password data");

    const user = await User.findById(req.user._id);
    if (!user || !user.isActive) throw new HttpError(401, "Account disabled");

    const ok = await user.verifyPassword(parsed.data.currentPassword);
    if (!ok) throw new HttpError(401, "Current password is incorrect");

    user.passwordHash = await User.hashPassword(parsed.data.newPassword);
    user.mustChangePassword = false;
    await user.save();

    res.json({ ok: true });
  })
);

module.exports = { authRouter: router };