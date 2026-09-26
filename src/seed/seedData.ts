import { Quote } from "../modules/quotes/quotes.model";
import { QuoteReaction } from "../modules/quotes/reaction.model";
import { QuoteComment } from "../modules/quotes/comment.model";
import { User } from "../modules/users/users.model";
import { Types } from "mongoose";
import { logger } from "../config/logger";
import { db } from "../config/db";
import { env } from "../config/env";

export const INITIAL_QUOTES = [
  {
    author: "Steve Jobs",
    content: "The only way to do great work is to love what you do.",
    tags: ["Inspiration", "Work", "Leadership"],
    likesCount: 12,
  },
  {
    author: "Albert Einstein",
    content: "Strive not to be a success, but rather to be of value.",
    tags: ["Life", "Inspiration", "Wisdom"],
    likesCount: 9,
  },
  {
    author: "Wayne Gretzky",
    content: "You miss 100% of the shots you don’t take.",
    tags: ["Action", "Sports", "Motivation"],
    likesCount: 15,
  },
  {
    author: "Peter Drucker",
    content: "The best way to predict the future is to create it.",
    tags: ["Future", "Strategy", "Leadership"],
    likesCount: 8,
  },
  {
    author: "Maya Angelou",
    content:
      "You will face many defeats in life, but never let yourself be defeated.",
    tags: ["Resilience", "Life", "Wisdom"],
    likesCount: 14,
  },
  {
    author: "Eleanor Roosevelt",
    content:
      "The future belongs to those who believe in the beauty of their dreams.",
    tags: ["Future", "Inspiration", "Dreams"],
    likesCount: 11,
  },
  {
    author: "Nelson Mandela",
    content: "It always seems impossible until it is done.",
    tags: ["Action", "Motivation", "Resilience"],
    likesCount: 20,
  },
  {
    author: "Aristotle",
    content:
      "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    tags: ["Wisdom", "Habits", "Leadership"],
    likesCount: 17,
  },
  {
    author: "Alan Kay",
    content: "The best way to predict the future is to invent it.",
    tags: ["Technology", "Future", "Innovation"],
    likesCount: 10,
  },
  {
    author: "Marcus Aurelius",
    content:
      "You have power over your mind - not outside events. Realize this, and you will find strength.",
    tags: ["Wisdom", "Life", "Resilience"],
    likesCount: 22,
  },
  {
    author: "Confucius",
    content: "It does not matter how slowly you go as long as you do not stop.",
    tags: ["Motivation", "Action", "Wisdom"],
    likesCount: 18,
  },
  {
    author: "Walt Disney",
    content: "The way to get started is to quit talking and begin doing.",
    tags: ["Action", "Leadership", "Motivation"],
    likesCount: 16,
  },
];

export const seedDatabase = async (): Promise<void> => {
  if (!db.isDbConnected()) {
    logger.info("ℹ️ Database seeder skipped because MongoDB is unavailable.");
    return;
  }

  try {
    if (env.NODE_ENV === "production") {
      const demoAdmin = await User.findOne({
        email: "test@gmail.com",
        role: "admin",
      })
        .select("+password")
        .exec();
      if (demoAdmin && (await demoAdmin.comparePassword("test123"))) {
        throw new Error(
          "The known demo administrator is still active. Promote a replacement admin and run admin:remove-demo before starting production.",
        );
      }
    }

    await QuoteReaction.init();
    const legacyQuotes = await Quote.collection
      .find({ "likedBy.0": { $exists: true } }, { projection: { likedBy: 1 } })
      .toArray();
    const legacyReactions = new Map<
      string,
      {
        updateOne: {
          filter: { quoteId: Types.ObjectId; userId: Types.ObjectId };
          update: {
            $setOnInsert: {
              quoteId: Types.ObjectId;
              userId: Types.ObjectId;
              type: "like";
            };
          };
          upsert: true;
        };
      }
    >();

    for (const quote of legacyQuotes) {
      const quoteId = quote._id as Types.ObjectId;
      const likedBy = Array.isArray(quote.likedBy) ? quote.likedBy : [];
      for (const userId of new Set(
        likedBy.map((id: Types.ObjectId) => id.toString()),
      )) {
        const voterId = new Types.ObjectId(userId);
        legacyReactions.set(`${quoteId}:${voterId}`, {
          updateOne: {
            filter: { quoteId, userId: voterId },
            update: {
              $setOnInsert: { quoteId, userId: voterId, type: "like" },
            },
            upsert: true,
          },
        });
      }
    }

    if (legacyReactions.size > 0) {
      await QuoteReaction.bulkWrite([...legacyReactions.values()], {
        ordered: false,
      });
    }
    await Quote.collection.updateMany(
      {
        $or: [
          { likedBy: { $exists: true } },
          { likesCount: { $exists: true } },
        ],
      },
      { $unset: { likedBy: "", likesCount: "" } },
    );

    await Quote.updateMany(
      { status: { $exists: false } },
      { $set: { status: "published" } },
    ).exec();

    const quoteCount = await Quote.countDocuments();
    if (quoteCount === 0) {
      const quotesToInsert = INITIAL_QUOTES.map((q) => ({
        ...q,
        status: "published",
      }));
      await Quote.insertMany(quotesToInsert);
      logger.info(
        `✅ Seeded ${quotesToInsert.length} initial inspirational quotes into MongoDB.`,
      );
    }
  } catch (error) {
    logger.warn("Could not complete database seeding:", error);
    throw error;
  }
};
