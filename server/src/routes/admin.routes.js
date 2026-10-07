const express = require("express");
const { z } = require("zod");
const { nanoid } = require("nanoid");

const { requireAuth, requireRole } = require("../middleware/auth");
const { asyncHandler } = require("../lib/asyncHandler");
const { HttpError } = require("../lib/httpError");
const { Doctor } = require("../models/Doctor.model");
const { Counter } = require("../models/Counter.model");
const { Token } = require("../models/Token.model");
const { getDateKey } = require("../lib/dateKey");
const { User } = require("../models/User.model");
const { events } = require("../lib/events");
const mongoose = require("mongoose");

const router = express.Router();

function emitDoctorQueueUpdated(doctorId, dateKey) {
  events.emit(`doctor:${doctorId}:${dateKey}:queue-updated`);
  events.emit("display:updated"); // keep TV display in sync too
}

// everything under /api/admin should require login
router.use(requireAuth);

const createDoctorSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z
    .string()
    .trim()
    .min(1)
    .max(6)
    .regex(/^[A-Za-z0-9]+$/, "Code must be alphanumeric"),
});

router.post(
  "/doctors",
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const parsed = createDoctorSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid doctor data");

    const doc = await Doctor.create({
      name: parsed.data.name,
      code: parsed.data.code.toUpperCase(),
    });

    res.status(201).json({ doctor: doc });
  })
);

router.get(
  "/doctors",
  requireRole("OWNER", "RECEPTION"),
  asyncHandler(async (req, res) => {
    const doctors = await Doctor.find().sort({ name: 1 });
    res.json({ doctors });
  })
);

const updateDoctorSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  code: z
    .string()
    .trim()
    .min(1)
    .max(6)
    .regex(/^[A-Za-z0-9]+$/)
    .optional(),
  isActive: z.boolean().optional(),
});

router.patch(
  "/doctors/:doctorId",
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const parsed = updateDoctorSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid update data");

    const update = { ...parsed.data };
    if (update.code) update.code = update.code.toUpperCase();

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.doctorId,
      update,
      { new: true }
    );

    if (!doctor) throw new HttpError(404, "Doctor not found");

    res.json({ doctor });
  })
);

const createTokenSchema = z.object({
  patientName: z.string().trim().min(2).max(80),
  patientPhone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .refine(
      (v) => !v || /^[0-9+ -]{7,20}$/.test(v),
      "Invalid phone number"
    ),
});

function formatDisplayToken(doctorCode, tokenNumber) {
  const num = String(tokenNumber).padStart(3, "0");
  return `${doctorCode}-${num}`;
}

router.post(
  "/doctors/:doctorId/tokens",
  requireRole("OWNER", "RECEPTION"),
  asyncHandler(async (req, res) => {
    const parsed = createTokenSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid patient data");

    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor || !doctor.isActive) {
      throw new HttpError(404, "Doctor not available");
    }

    const dateKey = getDateKey();

    // Atomic increment per doctor per day
    const counter = await Counter.findOneAndUpdate(
      { doctorId: doctor._id, dateKey },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const token = await Token.create({
      doctorId: doctor._id,
      dateKey,
      tokenNumber: counter.seq,
      patientName: parsed.data.patientName,
      patientPhone: parsed.data.patientPhone,
      publicId: nanoid(10),
      createdBy: req.user._id,
    });

    // Notify doctor queue and TV display
    emitDoctorQueueUpdated(doctor._id.toString(), dateKey);

    res.status(201).json({
      token: {
        id: token._id,
        publicId: token.publicId,
        dateKey: token.dateKey,
        tokenNumber: token.tokenNumber,
        displayToken: formatDisplayToken(
          doctor.code,
          token.tokenNumber
        ),
        doctor: {
          id: doctor._id,
          name: doctor.name,
          code: doctor.code,
        },
        status: token.status,
      },
    });
  })
);

router.get(
  "/doctors/:doctorId/queue",
  requireRole("OWNER", "RECEPTION"),
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) throw new HttpError(404, "Doctor not found");

    const dateKey = getDateKey();

    const tokens = await Token.find({
      doctorId: doctor._id,
      dateKey,
    })
      .sort({ tokenNumber: 1 })
      .select(
        "tokenNumber patientName patientPhone status publicId createdAt calledAt servedAt skippedAt"
      );

    res.json({
      doctor: {
        id: doctor._id,
        name: doctor.name,
        code: doctor.code,
      },
      dateKey,
      tokens,
    });
  })
);

// Call-next: if one is already CALLED and not finished, return it
// (prevents chaos)
router.post(
  "/doctors/:doctorId/call-next",
  requireRole("OWNER", "RECEPTION"),
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) throw new HttpError(404, "Doctor not found");

    const dateKey = getDateKey();

    const session = await mongoose.startSession();

    try {
      let resultPayload = null;

      await session.withTransaction(async () => {
        const alreadyCalled = await Token.findOne({
          doctorId: doctor._id,
          dateKey,
          status: "CALLED",
        })
          .sort({ tokenNumber: 1 })
          .session(session);

        if (alreadyCalled) {
          resultPayload = {
            token: alreadyCalled,
            displayToken: formatDisplayToken(
              doctor.code,
              alreadyCalled.tokenNumber
            ),
            alreadyCalled: true,
          };
          return;
        }

        const nextToken = await Token.findOneAndUpdate(
          {
            doctorId: doctor._id,
            dateKey,
            status: "WAITING",
          },
          {
            $set: {
              status: "CALLED",
              calledAt: new Date(),
            },
          },
          {
            sort: { tokenNumber: 1 },
            new: true,
            session,
          }
        );

        if (!nextToken) {
          throw new HttpError(404, "No waiting tokens");
        }

        resultPayload = {
          token: nextToken,
          displayToken: formatDisplayToken(
            doctor.code,
            nextToken.tokenNumber
          ),
          alreadyCalled: false,
        };
      });

      // Emit events OUTSIDE transaction
      // (better behavior)
      if (resultPayload?.token?.publicId) {
        events.emit(
          `token:${resultPayload.token.publicId}:updated`
        );

        // Only emit queue-updated when status actually changed
        // to CALLED.
        if (!resultPayload.alreadyCalled) {
          emitDoctorQueueUpdated(
            doctor._id.toString(),
            dateKey
          );
        }
      }

      res.json(resultPayload);
    } finally {
      session.endSession();
    }
  })
);

async function updateTokenStatusOrFail(
  tokenId,
  allowedFromStatuses,
  newStatus,
  timeField
) {
  const token = await Token.findById(tokenId);

  if (!token) {
    throw new HttpError(404, "Token not found");
  }

  if (!allowedFromStatuses.includes(token.status)) {
    throw new HttpError(
      409,
      `Cannot mark token as ${newStatus} from status ${token.status}`
    );
  }

  token.status = newStatus;
  token[timeField] = new Date();

  await token.save();

  // Keep existing per-token event
  events.emit(`token:${token.publicId}:updated`);

  // Notify doctor queue + TV display
  emitDoctorQueueUpdated(
    token.doctorId.toString(),
    token.dateKey
  );

  return token;
}

router.post(
  "/tokens/:tokenId/serve",
  requireRole("OWNER", "RECEPTION"),
  asyncHandler(async (req, res) => {
    const token = await updateTokenStatusOrFail(
      req.params.tokenId,
      ["CALLED"],
      "SERVED",
      "servedAt"
    );

    res.json({ token });
  })
);

router.post(
  "/tokens/:tokenId/skip",
  requireRole("OWNER", "RECEPTION"),
  asyncHandler(async (req, res) => {
    const token = await updateTokenStatusOrFail(
      req.params.tokenId,
      ["CALLED"],
      "SKIPPED",
      "skippedAt"
    );

    res.json({ token });
  })
);

router.post(
  "/tokens/:tokenId/cancel",
  requireRole("OWNER", "RECEPTION"),
  asyncHandler(async (req, res) => {
    const token = await updateTokenStatusOrFail(
      req.params.tokenId,
      ["WAITING", "CALLED"],
      "CANCELLED",
      "cancelledAt"
    );

    res.json({ token });
  })
);

// List all users
router.get(
  "/users",
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const users = await User.find()
      .select(
        "_id name email role isActive mustChangePassword createdAt"
      )
      .sort({ createdAt: -1 });

    res.json({ users });
  })
);

const createReceptionSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().max(120),
});

function generateTempPassword() {
  return `Tmp#${nanoid(10)}`;
}

// Create RECEPTION user (returns temp password once)
router.post(
  "/users/reception",
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const parsed = createReceptionSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Invalid user data");
    }

    const email = parsed.data.email.toLowerCase();

    const exists = await User.findOne({ email });

    if (exists) {
      throw new HttpError(409, "Email already exists");
    }

    const tempPassword = generateTempPassword();

    const user = await User.create({
      name: parsed.data.name,
      email,
      passwordHash: await User.hashPassword(tempPassword),
      role: "RECEPTION",
      mustChangePassword: true,
      isActive: true,
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      tempPassword,
    });
  })
);

// Enable/disable user
router.patch(
  "/users/:userId",
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      isActive: z.boolean(),
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, "Invalid update");
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        isActive: parsed.data.isActive,
      },
      {
        new: true,
      }
    ).select(
      "_id name email role isActive mustChangePassword"
    );

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    res.json({ user });
  })
);
router.get(
  "/doctors/:doctorId/queue/stream",
  requireRole("OWNER", "RECEPTION"),
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) throw new HttpError(404, "Doctor not found");

    const dateKey = getDateKey();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const send = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    async function buildPayload() {
      const tokens = await Token.find({ doctorId: doctor._id, dateKey })
        .sort({ tokenNumber: 1 })
        .select("tokenNumber patientName patientPhone status publicId createdAt calledAt servedAt skippedAt cancelledAt");

      return {
        doctor: { id: doctor._id, name: doctor.name, code: doctor.code },
        dateKey,
        tokens
      };
    }

    // initial payload
    send("queue", await buildPayload());

    // keep alive
    const pingTimer = setInterval(() => {
      res.write(`event: ping\n`);
      res.write(`data: {}\n\n`);
    }, 25000);

    const eventName = `doctor:${doctor._id.toString()}:${dateKey}:queue-updated`;

    const handler = async () => {
      try {
        send("queue", await buildPayload());
      } catch {
        // keep stream alive
      }
    };

    events.on(eventName, handler);

    req.on("close", () => {
      clearInterval(pingTimer);
      events.off(eventName, handler);
      res.end();
    });
  })
);

module.exports = { adminRouter: router };