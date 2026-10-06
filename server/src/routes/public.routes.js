const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { HttpError } = require("../lib/httpError");
const { Token } = require("../models/Token.model");
const { Doctor } = require("../models/Doctor.model");
const { events } = require("../lib/events");

const router = express.Router();

async function buildPublicTokenPayload(publicId) {
  const token = await Token.findOne({ publicId }).select(
    "publicId doctorId dateKey tokenNumber status calledAt servedAt skippedAt cancelledAt"
  );
  if (!token) throw new HttpError(404, "Token not found");

  const doctor = await Doctor.findById(token.doctorId).select("name code isActive");
  if (!doctor) throw new HttpError(404, "Doctor not found");

  let position = null;

  if (token.status === "WAITING") {
    position =
      (await Token.countDocuments({
        doctorId: token.doctorId,
        dateKey: token.dateKey,
        status: "WAITING",
        tokenNumber: { $lt: token.tokenNumber }
      })) + 1;
  }

  return {
    token: {
      publicId: token.publicId,
      dateKey: token.dateKey,
      tokenNumber: token.tokenNumber,
      status: token.status,
      calledAt: token.calledAt,
      servedAt: token.servedAt,
      skippedAt: token.skippedAt,
      cancelledAt: token.cancelledAt
    },
    doctor: { name: doctor.name, code: doctor.code, isActive: doctor.isActive },
    position
  };
}

// Normal fetch (for non-realtime clients)
router.get(
  "/tokens/:publicId",
  asyncHandler(async (req, res) => {
    const payload = await buildPublicTokenPayload(req.params.publicId);
    res.json(payload);
  })
);

// Realtime stream (SSE)
router.get(
  "/tokens/:publicId/stream",
  asyncHandler(async (req, res) => {
    const publicId = req.params.publicId;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    // If you ever enable CORS separately, do it carefully. For same-origin it’s fine.
    res.flushHeaders?.();

    const send = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Send initial state immediately
    try {
      const payload = await buildPublicTokenPayload(publicId);
      send("token", payload);
    } catch (e) {
      send("error", { message: "Token not found" });
    }

    // Keep-alive ping (Render/proxies can close idle connections)
    const pingTimer = setInterval(() => {
      res.write(`event: ping\n`);
      res.write(`data: {}\n\n`);
    }, 25000);

    const handler = async () => {
      try {
        const payload = await buildPublicTokenPayload(publicId);
        send("token", payload);
      } catch {
        send("error", { message: "Token not found" });
      }
    };

    events.on(`token:${publicId}:updated`, handler);

    req.on("close", () => {
      clearInterval(pingTimer);
      events.off(`token:${publicId}:updated`, handler);
      res.end();
    });
  })
);

module.exports = { publicRouter: router };