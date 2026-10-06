const mongoose = require("mongoose");

const TOKEN_STATUS = ["WAITING", "CALLED", "SERVED", "SKIPPED", "CANCELLED"];

const tokenSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    dateKey: { type: String, required: true },
    tokenNumber: { type: Number, required: true },

    patientName: { type: String, required: true, trim: true, maxlength: 80 },
    patientPhone: { type: String, trim: true, maxlength: 20 }, // store E.164 if possible

    status: { type: String, enum: TOKEN_STATUS, default: "WAITING", required: true },

    publicId: { type: String, required: true, unique: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    calledAt: { type: Date },
    servedAt: { type: Date },
    skippedAt: { type: Date },
    cancelledAt: { type: Date }
  },
  { timestamps: true }
);

tokenSchema.index({ doctorId: 1, dateKey: 1, tokenNumber: 1 }, { unique: true });
tokenSchema.index({ doctorId: 1, dateKey: 1, status: 1, tokenNumber: 1 });

const Token = mongoose.model("Token", tokenSchema);

module.exports = { Token, TOKEN_STATUS };