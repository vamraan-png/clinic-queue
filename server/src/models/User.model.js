const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["OWNER", "RECEPTION"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    isActive: { type: Boolean, default: true },
    phone: { type: String, trim: true, maxlength: 20 },
mustChangePassword: { type: Boolean, default: false }
    
  },
  { timestamps: true }
);

userSchema.methods.verifyPassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
const User = mongoose.model("User", userSchema);

module.exports = { User, ROLES };