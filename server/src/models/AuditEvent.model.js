const mongoose = require("mongoose");

const auditEventSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorEmail: { type: String },
    actorRole: { type: String },

    action: { type: String, required: true }, // e.g. TOKEN_CREATE, TOKEN_CALL_NEXT, TOKEN_SERVED...
    entityType: { type: String, required: true }, // TOKEN, DOCTOR, USER
    entityId: { type: mongoose.Schema.Types.ObjectId },

    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    dateKey: { type: String }, // helpful for daily filtering

    meta: { type: Object }, // keep small: tokenNumber, statusFrom, statusTo, etc.

    ip: { type: String },
    userAgent: { type: String }
  },
  { timestamps: true }
);

auditEventSchema.index({ createdAt: -1 });
auditEventSchema.index({ dateKey: 1, doctorId: 1, createdAt: -1 });
auditEventSchema.index({ action: 1, createdAt: -1 });

const AuditEvent = mongoose.model("AuditEvent", auditEventSchema);

module.exports = { AuditEvent };