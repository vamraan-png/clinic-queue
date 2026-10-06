const mongoose = require("mongoose");
const { env } = require("./config/env");
const { createApp } = require("./app");
const { seedOwnerFromEnv } = require("./config/seedOwner");

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  await seedOwnerFromEnv();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});