const express = require("express");
const { z } = require("zod");

const { asyncHandler } = require("../lib/asyncHandler");
const { requireRole } = require("../middleware/auth");
const { Token } = require("../models/Token.model");
const { getDateKey } = require("../lib/dateKey");

const router = express.Router();

// OWNER only
router.use(requireRole("OWNER"));

const querySchema = z.object({
  dateKey: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
});

function msToMinutes(ms) {
  return Math.round((ms / 60000) * 10) / 10; // 1 decimal
}

router.get(
  "/daily",
  asyncHandler(async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: "Invalid dateKey format" });

    const dateKey = parsed.data.dateKey || getDateKey();

    // Aggregate per doctor for a given dateKey
    const rows = await Token.aggregate([
      { $match: { dateKey } },
      {
        $group: {
          _id: "$doctorId",
          total: { $sum: 1 },

          waiting: { $sum: { $cond: [{ $eq: ["$status", "WAITING"] }, 1, 0] } },
          called: { $sum: { $cond: [{ $eq: ["$status", "CALLED"] }, 1, 0] } },
          served: { $sum: { $cond: [{ $eq: ["$status", "SERVED"] }, 1, 0] } },
          skipped: { $sum: { $cond: [{ $eq: ["$status", "SKIPPED"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } },

          waitMsTotal: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$calledAt", null] }, { $ne: ["$createdAt", null] }] },
                { $subtract: [{ $toLong: "$calledAt" }, { $toLong: "$createdAt" }] },
                0
              ]
            }
          },
          waitCount: {
            $sum: { $cond: [{ $ne: ["$calledAt", null] }, 1, 0] }
          },

          serviceMsTotal: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$servedAt", null] }, { $ne: ["$calledAt", null] }] },
                { $subtract: [{ $toLong: "$servedAt" }, { $toLong: "$calledAt" }] },
                0
              ]
            }
          },
          serviceCount: {
            $sum: { $cond: [{ $ne: ["$servedAt", null] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "_id",
          as: "doctor"
        }
      },
      { $unwind: "$doctor" },
      {
        $project: {
          _id: 0,
          doctor: { id: "$doctor._id", name: "$doctor.name", code: "$doctor.code", isActive: "$doctor.isActive" },
          total: 1,
          waiting: 1,
          called: 1,
          served: 1,
          skipped: 1,
          cancelled: 1,
          waitMsTotal: 1,
          waitCount: 1,
          serviceMsTotal: 1,
          serviceCount: 1
        }
      },
      { $sort: { "doctor.name": 1 } }
    ]);

    const doctorRows = rows.map((r) => ({
      doctor: r.doctor,
      counts: {
        total: r.total,
        waiting: r.waiting,
        called: r.called,
        served: r.served,
        skipped: r.skipped,
        cancelled: r.cancelled
      },
      avgWaitMinutes: r.waitCount ? msToMinutes(r.waitMsTotal / r.waitCount) : null,
      avgServiceMinutes: r.serviceCount ? msToMinutes(r.serviceMsTotal / r.serviceCount) : null
    }));

    const totals = doctorRows.reduce(
      (acc, r) => {
        acc.total += r.counts.total;
        acc.waiting += r.counts.waiting;
        acc.called += r.counts.called;
        acc.served += r.counts.served;
        acc.skipped += r.counts.skipped;
        acc.cancelled += r.counts.cancelled;
        return acc;
      },
      { total: 0, waiting: 0, called: 0, served: 0, skipped: 0, cancelled: 0 }
    );

    res.setHeader("Cache-Control", "no-store");
    res.json({
      dateKey,
      totals,
      doctors: doctorRows,
      generatedAt: new Date().toISOString()
    });
  })
);

module.exports = { reportsRouter: router };