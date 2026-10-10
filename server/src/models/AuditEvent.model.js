const mongoose = require("mongoose");

const retentionDays = Number(process.env.AUDIT_RETENTION_DAYS || 180);

const auditEventSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorEmail: { type: String },
    actorRole: { type: String },

    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },

    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    dateKey: { type: String },

    meta: { type: Object },

    ip: { type: String },
    userAgent: { type: String }
  },
  { timestamps: true }
);

// Existing indexes
auditEventSchema.index({ createdAt: -1 });
auditEventSchema.index({ dateKey: 1, doctorId: 1, createdAt: -1 });
auditEventSchema.index({ action: 1, createdAt: -1 });

// TTL index: automatically expire audit events after the retention period.
auditEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: retentionDays * 24 * 60 * 60 }
);

const AuditEvent = mongoose.model("AuditEvent", auditEventSchema);

module.exports = { AuditEvent };