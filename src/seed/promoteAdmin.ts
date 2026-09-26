import { db } from "../config/db";
import { logger } from "../config/logger";
import { User } from "../modules/users/users.model";

const promoteAdmin = async (): Promise<void> => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    throw new Error(
      "Set ADMIN_EMAIL before promoting or bootstrapping an admin.",
    );
  }

  await db.connect();
  try {
    let user = await User.findOne({ email }).exec();
    if (user) {
      user.role = "admin";
      await user.save();
    } else {
      const username = process.env.ADMIN_USERNAME?.trim();
      const password = process.env.ADMIN_PASSWORD;
      if (!username || !password || password.length < 12) {
        throw new Error(
          "For a new admin, set ADMIN_USERNAME and a unique ADMIN_PASSWORD of at least 12 characters through your secret manager.",
        );
      }
      user = await User.create({ username, email, password, role: "admin" });
    }

    logger.info(`Admin role assigned to ${user.email}.`);
  } finally {
    await db.disconnect();
  }
};

promoteAdmin().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(`Admin promotion failed: ${message}`);
  process.exitCode = 1;
});
