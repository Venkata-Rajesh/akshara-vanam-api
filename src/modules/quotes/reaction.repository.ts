import { Types } from "mongoose";
import { QuoteReaction, ReactionType } from "./reaction.model";

export interface ReactionSummary {
  likesCount: number;
  dislikesCount: number;
  userReaction: ReactionType | null;
}

export class ReactionRepository {
  async setReaction(
    quoteId: string,
    userId: string,
    type: ReactionType | null,
  ): Promise<void> {
    const filter = {
      quoteId: new Types.ObjectId(quoteId),
      userId: new Types.ObjectId(userId),
    };

    if (type === null) {
      await QuoteReaction.deleteOne(filter).exec();
      return;
    }

    try {
      await QuoteReaction.findOneAndUpdate(
        filter,
        { $set: { type } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).exec();
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      await QuoteReaction.findOneAndUpdate(filter, { $set: { type } }).exec();
    }
  }

  async getSummaries(
    quoteIds: string[],
    userId?: string,
  ): Promise<Record<string, ReactionSummary>> {
    const ids = quoteIds.map((id) => new Types.ObjectId(id));
    const summaries = new Map<string, ReactionSummary>(
      quoteIds.map((id) => [
        id,
        { likesCount: 0, dislikesCount: 0, userReaction: null },
      ]),
    );
    if (ids.length === 0) return Object.fromEntries(summaries);

    const [counts, userReactions] = await Promise.all([
      QuoteReaction.aggregate([
        { $match: { quoteId: { $in: ids } } },
        {
          $group: {
            _id: { quoteId: "$quoteId", type: "$type" },
            count: { $sum: 1 },
          },
        },
      ]),
      userId
        ? QuoteReaction.find({ quoteId: { $in: ids }, userId })
            .select("quoteId type")
            .lean()
            .exec()
        : Promise.resolve([]),
    ]);

    for (const item of counts) {
      const summary = summaries.get(item._id.quoteId.toString());
      if (!summary) continue;
      if (item._id.type === "like") summary.likesCount = item.count;
      if (item._id.type === "dislike") summary.dislikesCount = item.count;
    }

    for (const item of userReactions) {
      const summary = summaries.get(item.quoteId.toString());
      if (summary) summary.userReaction = item.type;
    }

    return Object.fromEntries(summaries);
  }
}

export const reactionRepository = new ReactionRepository();
