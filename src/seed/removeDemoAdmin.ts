import { db } from "../config/db";
import { logger } from "../config/logger";
import { QuoteComment } from "../modules/quotes/comment.model";
import { Quote } from "../modules/quotes/quotes.model";
import { QuoteReaction } from "../modules/quotes/reaction.model";
import { User } from "../modules/users/users.model";

const removeDemoAdmin = async (): Promise<void> => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || adminEmail === "test@gmail.com") {
    throw new Error(
      "Set ADMIN_EMAIL to a different existing administrator account.",
    );
  }

  await db.connect();
  try {
    const admin = await User.findOne({
      email: adminEmail,
      role: "admin",
    }).exec();
    if (!admin)
      throw new Error("ADMIN_EMAIL must belong to an existing admin account.");

    const demoAdmin = await User.findOne({ email: "test@gmail.com" })
      .select("+password")
      .exec();
    if (!demoAdmin || !(await demoAdmin.comparePassword("test123"))) {
      logger.info(
        "No seeded demo account with the known default password was found.",
      );
      return;
    }

    await Quote.updateMany(
      { createdBy: demoAdmin._id },
      { $set: { createdBy: admin._id } },
    ).exec();
    await Promise.all([
      QuoteReaction.deleteMany({ userId: demoAdmin._id }).exec(),
      QuoteComment.deleteMany({ userId: demoAdmin._id }).exec(),
    ]);
    await demoAdmin.deleteOne();
    logger.info(
      "Removed the seeded demo administrator and transferred its quotes.",
    );
  } finally {
    await db.disconnect();
  }
};

removeDemoAdmin().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(`Demo admin cleanup failed: ${message}`);
  process.exitCode = 1;
});
