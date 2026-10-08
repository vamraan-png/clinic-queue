const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    dateKey: { type: String, required: true }, // YYYY-MM-DD in clinic timezone
    seq: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

counterSchema.index({ doctorId: 1, dateKey: 1 }, { unique: true });

const Counter = mongoose.model("Counter", counterSchema);

module.exports = { Counter };