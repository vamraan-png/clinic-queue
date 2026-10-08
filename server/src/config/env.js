const dotenv = require("dotenv");

dotenv.config();

function mustGet(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing environment variable: ${name}`);
  return val;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  MONGODB_URI: mustGet("MONGODB_URI"),
  JWT_SECRET: mustGet("JWT_SECRET")
};

module.exports = { env };