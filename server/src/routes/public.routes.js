const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { HttpError } = require("../lib/httpError");
const { Token } = require("../models/Token.model");
const { Doctor } = require("../models/Doctor.model");
const { events } = require("../lib/events");
const { getDateKey } = require("../lib/dateKey");

const router = express.Router();
// Track active public SSE connections in this server process.
const MAX_PUBLIC_SSE_CONNECTIONS = 100;
let activePublicSSEConnections = 0;

function openPublicSSE(req, res) {
  if (activePublicSSEConnections >= MAX_PUBLIC_SSE_CONNECTIONS) {
    res.set("Retry-After", "30");
    res.status(503).json({
      error: "Live updates are busy. Please try again shortly."
    });
    return false;
  }

  activePublicSSEConnections++;

  let released = false;

  const release = () => {
    if (released) return;
    released = true;
    activePublicSSEConnections--;
  };

  res.on("close", release);
  res.on("finish", release);

  return true;
}

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
    if (!openPublicSSE(req, res)) return;
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
  return res.end();
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

// Build display payload for ALL active doctors
async function buildDisplayPayload() {
  const dateKey = getDateKey();

  const doctors = await Doctor.find({ isActive: true })
    .select("name code")
    .sort({ name: 1 });

  const rows = await Promise.all(
    doctors.map(async (d) => {
      const called = await Token.findOne({
        doctorId: d._id,
        dateKey,
        status: "CALLED"
      })
        .sort({ tokenNumber: 1 })
        .select("tokenNumber");

      const nextWaiting = await Token.find({
        doctorId: d._id,
        dateKey,
        status: "WAITING"
      })
        .sort({ tokenNumber: 1 })
        .limit(5)
        .select("tokenNumber");

      const waitingCount = await Token.countDocuments({
        doctorId: d._id,
        dateKey,
        status: "WAITING"
      });

      return {
        doctor: { id: d._id, name: d.name, code: d.code },
        nowServing: called ? called.tokenNumber : null,
        upNext: nextWaiting.map((t) => t.tokenNumber),
        waitingCount
      };
    })
  );

  return { dateKey, doctors: rows, generatedAt: new Date().toISOString() };
}

// Snapshot endpoint (useful for debugging)
router.get(
  "/display",
  asyncHandler(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const payload = await buildDisplayPayload();
    res.json(payload);
  })
);

// SSE stream (TV screen will use this)
router.get(
  "/display/stream",
  asyncHandler(async (req, res) => {
    if (!openPublicSSE(req, res)) return;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const send = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // initial
    try {
      const payload = await buildDisplayPayload();
      send("display", payload);
    } catch {
      send("error", { message: "Unable to load display data" });
    }

    // keep alive
    const pingTimer = setInterval(() => {
      res.write(`event: ping\n`);
      res.write(`data: {}\n\n`);
    }, 25000);

    const handler = async () => {
      try {
        const payload = await buildDisplayPayload();
        send("display", payload);
      } catch {
        // don’t kill stream on errors
      }
    };

    events.on("display:updated", handler);

    req.on("close", () => {
      clearInterval(pingTimer);
      events.off("display:updated", handler);
      res.end();
    });
  })
);

module.exports = { publicRouter: router };