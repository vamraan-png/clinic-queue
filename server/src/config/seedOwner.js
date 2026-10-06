const { User } = require("../models/User.model");

async function seedOwnerFromEnv() {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;
  const name = process.env.OWNER_NAME || "Clinic Owner";

  if (!email || !password) return; // no auto-seed unless provided

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return;

  const passwordHash = await User.hashPassword(password);

  await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: "OWNER"
  });

  console.log("Seeded OWNER user:", email);
}

module.exports = { seedOwnerFromEnv };