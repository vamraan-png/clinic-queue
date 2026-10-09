const express = require("express");
const { z } = require("zod");
const { requireRole } = require("../middleware/auth");
const { asyncHandler } = require("../lib/asyncHandler");
const { AuditEvent } = require("../models/AuditEvent.model");

const router = express.Router();
router.use(requireRole("OWNER"));

const querySchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  doctorId: z.string().optional(),
  action: z.string().optional(),
  limit: z.string().optional()
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: "Invalid query" });

    const { dateKey, doctorId, action } = parsed.data;
    const limit = Math.min(Number(parsed.data.limit || 50), 200);

    const filter = {};
    if (dateKey) filter.dateKey = dateKey;
    if (doctorId) filter.doctorId = doctorId;
    if (action) filter.action = action;

    const events = await AuditEvent.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("createdAt actorEmail actorRole action entityType entityId doctorId dateKey meta ip");

    res.setHeader("Cache-Control", "no-store");
    res.json({ events });
  })
);

module.exports = { auditRouter: router };