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
const crypto = require("crypto");
const { sendEmail } = require("../services/email.service");

const {
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} = require("../middleware/rateLimits");

const router = express.Router();

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function makeResetToken() {
  return crypto.randomBytes(32).toString("base64url");
}

// ------------------------------------------
// LOGIN
// ------------------------------------------

const loginSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(72),
});

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Invalid login data");
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user || !user.isActive) {
      throw new HttpError(401, "Invalid credentials");
    }

    const ok = await user.verifyPassword(password);

    if (!ok) {
      throw new HttpError(401, "Invalid credentials");
    }

    const token = signAuthToken({
  sub: user._id.toString(),
  role: user.role,
  tokenVersion: user.tokenVersion ?? 0,
});

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  })
);

// ------------------------------------------
// LOGOUT
// ------------------------------------------

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    res.clearCookie(COOKIE_NAME, {
      path: "/",
    });

    res.json({ ok: true });
  })
);

// ------------------------------------------
// CURRENT USER
// ------------------------------------------

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(200).json({ user: null });
    }

    try {
      const { verifyAuthToken } = require("../lib/jwt");
      const payload = verifyAuthToken(token);

      const user = await User.findById(payload.sub).select(
        "_id name email role isActive mustChangePassword tokenVersion"
      );

      if (!user || !user.isActive) {
        return res.json({ user: null });
      }

      // Reject sessions created before a password change or reset.
      if ((payload.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
        return res.json({ user: null });
      }

      return res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
      });
    } catch {
      return res.json({ user: null });
    }
  })
);

// ------------------------------------------
// CHANGE PASSWORD
// ------------------------------------------

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(72),
  newPassword: z.string().min(10).max(72),
});

router.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Invalid password data");
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      throw new HttpError(401, "Account disabled");
    }

    const ok = await user.verifyPassword(
      parsed.data.currentPassword
    );

    if (!ok) {
      throw new HttpError(
        401,
        "Current password is incorrect"
      );
    }

    user.passwordHash = await User.hashPassword(
      parsed.data.newPassword
    );

  user.mustChangePassword = false;
user.tokenVersion = (user.tokenVersion ?? 0) + 1;

await user.save();

// Invalidate the current browser's old JWT too.
res.clearCookie(COOKIE_NAME, { path: "/" });

res.json({ ok: true });
  })
);

// ------------------------------------------
// FORGOT PASSWORD
// ------------------------------------------

const forgotSchema = z.object({
  email: z.string().email().max(120),
});

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  asyncHandler(async (req, res) => {
    const parsed = forgotSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Invalid email");
    }

    const email = parsed.data.email.toLowerCase();

    const user = await User.findOne({ email });

    if (user && user.isActive) {
      const token = makeResetToken();

      user.passwordResetTokenHash = sha256(token);

      user.passwordResetExpiresAt = new Date(
        Date.now() + 30 * 60 * 1000
      );

      await user.save();

      const appUrl = process.env.APP_URL;

      if (appUrl) {
        const link = `${appUrl}/reset-password/${token}`;

        const subject = "Reset your password";

        const text =
          `A password reset was requested for your account.\n\n` +
          `Reset link (valid 30 minutes): ${link}\n\n` +
          `If you did not request this, you can ignore this email.`;

        const html = `
          <p>A password reset was requested for your account.</p>
          <p><strong>Reset link (valid 30 minutes):</strong></p>
          <p><a href="${link}">${link}</a></p>
          <p>If you did not request this, you can ignore this email.</p>
        `;

        sendEmail({
          to: email,
          subject,
          text,
          html,
        }).catch((err) => {
          console.error(
            "[forgot-password email error]",
            err
          );
        });
      }
    }

    // Do not reveal whether an email address has an account.
    res.json({ ok: true });
  })
);

// ------------------------------------------
// RESET PASSWORD
// ------------------------------------------

const resetSchema = z.object({
  token: z.string().min(10).max(300),
  newPassword: z.string().min(10).max(72),
});

router.post(
  "/reset-password",
  resetPasswordLimiter,
  asyncHandler(async (req, res) => {
    const parsed = resetSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Invalid reset data");
    }

    const tokenHash = sha256(parsed.data.token);

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: {
        $gt: new Date(),
      },
      isActive: true,
    });

    if (!user) {
      throw new HttpError(
        400,
        "Invalid or expired reset token"
      );
    }

    user.passwordHash = await User.hashPassword(
      parsed.data.newPassword
    );

    user.mustChangePassword = false;
user.tokenVersion = (user.tokenVersion ?? 0) + 1;

// Make the reset token single-use.
user.passwordResetTokenHash = undefined;
user.passwordResetExpiresAt = undefined;

await user.save();

res.json({ ok: true });
  })
);

module.exports = { authRouter: router };