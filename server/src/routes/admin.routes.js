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

const router = express.Router();

// everything under /api/admin should require login
router.use(requireAuth);

const createDoctorSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().min(1).max(6).regex(/^[A-Za-z0-9]+$/, "Code must be alphanumeric")
});

router.post(
  "/doctors",
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const parsed = createDoctorSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid doctor data");

    const doc = await Doctor.create({
      name: parsed.data.name,
      code: parsed.data.code.toUpperCase()
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
  code: z.string().trim().min(1).max(6).regex(/^[A-Za-z0-9]+$/).optional(),
  isActive: z.boolean().optional()
});

router.patch(
  "/doctors/:doctorId",
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const parsed = updateDoctorSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid update data");

    const update = { ...parsed.data };
    if (update.code) update.code = update.code.toUpperCase();

    const doctor = await Doctor.findByIdAndUpdate(req.params.doctorId, update, { new: true });
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
    .refine((v) => !v || /^[0-9+ -]{7,20}$/.test(v), "Invalid phone number")
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
    if (!doctor || !doctor.isActive) throw new HttpError(404, "Doctor not available");

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
      createdBy: req.user._id
    });

    res.status(201).json({
      token: {
        id: token._id,
        publicId: token.publicId,
        dateKey: token.dateKey,
        tokenNumber: token.tokenNumber,
        displayToken: formatDisplayToken(doctor.code, token.tokenNumber),
        doctor: { id: doctor._id, name: doctor.name, code: doctor.code },
        status: token.status
      }
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
    const tokens = await Token.find({ doctorId: doctor._id, dateKey })
      .sort({ tokenNumber: 1 })
      .select("tokenNumber patientName patientPhone status publicId createdAt calledAt servedAt skippedAt");

    res.json({ doctor: { id: doctor._id, name: doctor.name, code: doctor.code }, dateKey, tokens });
  })
);

// Call-next: if one is already CALLED and not finished, return it (prevents chaos)
router.post(
  "/doctors/:doctorId/call-next",
  requireRole("OWNER", "RECEPTION"),
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) throw new HttpError(404, "Doctor not found");

    const dateKey = getDateKey();

    const alreadyCalled = await Token.findOne({
      doctorId: doctor._id,
      dateKey,
      status: "CALLED"
    }).sort({ tokenNumber: 1 });

    if (alreadyCalled) {
      return res.json({
        token: alreadyCalled,
        displayToken: formatDisplayToken(doctor.code, alreadyCalled.tokenNumber),
        alreadyCalled: true
      });
    }

    const nextToken = await Token.findOne({
      doctorId: doctor._id,
      dateKey,
      status: "WAITING"
    }).sort({ tokenNumber: 1 });

    if (!nextToken) throw new HttpError(404, "No waiting tokens");

    nextToken.status = "CALLED";
nextToken.calledAt = new Date();
await nextToken.save();

// notify realtime listeners
events.emit(`token:${nextToken.publicId}:updated`);

// optional SMS
const appUrl = process.env.APP_URL; // set this in Render and .env
if (appUrl && nextToken.patientPhone) {
  const link = `${appUrl}/t/${nextToken.publicId}`;
  const msg = `Your token ${doctor.code}-${String(nextToken.tokenNumber).padStart(3, "0")} for ${doctor.name} is now CALLED. Track: ${link}`;
  // do not crash if SMS fails
  sendSms(nextToken.patientPhone, msg).catch(() => {});
}

    res.json({
      token: nextToken,
      displayToken: formatDisplayToken(doctor.code, nextToken.tokenNumber),
      alreadyCalled: false
    });
  })
);

async function updateTokenStatusOrFail(tokenId, allowedFromStatuses, newStatus, timeField) {
  const token = await Token.findById(tokenId);
  if (!token) throw new HttpError(404, "Token not found");

  if (!allowedFromStatuses.includes(token.status)) {
    throw new HttpError(409, `Cannot mark token as ${newStatus} from status ${token.status}`);
  }

  token.status = newStatus;
  token[timeField] = new Date();
  await token.save();
  events.emit(`token:${token.publicId}:updated`);
  return token;
}

router.post(
  "/tokens/:tokenId/serve",
  requireRole("OWNER", "RECEPTION"),
  asyncHandler(async (req, res) => {
    const token = await updateTokenStatusOrFail(req.params.tokenId, ["CALLED"], "SERVED", "servedAt");
    res.json({ token });
  })
);

router.post(
  "/tokens/:tokenId/skip",
  requireRole("OWNER", "RECEPTION"),
  asyncHandler(async (req, res) => {
    const token = await updateTokenStatusOrFail(req.params.tokenId, ["CALLED"], "SKIPPED", "skippedAt");
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

module.exports = { adminRouter: router };