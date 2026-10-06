const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    code: { type: String, required: true, trim: true, uppercase: true, minlength: 1, maxlength: 6 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

doctorSchema.index({ code: 1 }, { unique: true });

const Doctor = mongoose.model("Doctor", doctorSchema);

module.exports = { Doctor };