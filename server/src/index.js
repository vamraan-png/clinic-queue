const mongoose = require("mongoose");
const { env } = require("./config/env");
const { createApp } = require("./app");
const { seedOwnerFromEnv } = require("./config/seedOwner");

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  await seedOwnerFromEnv();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
  });

  process.on("SIGTERM", async () => {
    console.log("SIGTERM received, shutting down...");
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});