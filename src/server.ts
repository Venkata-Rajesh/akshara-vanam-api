import { createApp } from "./app";
import { env } from "./config/env";
import { db } from "./config/db";
import { logger } from "./config/logger";
import { seedDatabase } from "./seed/seedData";

const startServer = async (): Promise<void> => {
  const app = createApp();

  // 1. Connect to Database & Seed Initial Data
  await db.connect();
  await seedDatabase();

  // 2. Start HTTP Server
  const server = app.listen(env.PORT, () => {
    logger.info(
      `🚀 Server running on http://localhost:${env.PORT} [${env.NODE_ENV} mode]`,
    );
    logger.info(`👉 Health Check: http://localhost:${env.PORT}/health`);
    logger.info(`👉 Auth API: http://localhost:${env.PORT}/api/v1/auth`);
    logger.info(`👉 Quotes API: http://localhost:${env.PORT}/api/v1/quotes`);
  });

  // 3. Graceful Shutdown Handlers
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    server.close(async () => {
      logger.info("HTTP server closed.");
      await db.disconnect();
      logger.info("Process terminated cleanly.");
      process.exit(0);
    });

    // Force close if graceful shutdown takes too long
    setTimeout(() => {
      logger.error("Forcefully shutting down server due to timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(`Fatal error during server startup: ${message}`);
  logger.error(
    "Verify MONGODB_URI, MongoDB Atlas Network Access, database credentials, and local network/DNS access.",
  );
  process.exit(1);
});
