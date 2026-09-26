import { NotFoundError } from "../../utils/appError";
import { Quote } from "./quotes.model";
import { ReactionRepository, reactionRepository } from "./reaction.repository";
import { ReactionType } from "./reaction.model";

export class ReactionService {
  constructor(private repository: ReactionRepository = reactionRepository) {}

  async setReaction(
    quoteId: string,
    userId: string,
    type: ReactionType | null,
  ) {
    const quoteExists = await Quote.exists({
      _id: quoteId,
      status: "published",
    });
    if (!quoteExists) throw new NotFoundError("Quote not found");

    await this.repository.setReaction(quoteId, userId, type);
    const summaries = await this.repository.getSummaries([quoteId], userId);
    return summaries[quoteId];
  }

  getSummaries(quoteIds: string[], userId?: string) {
    return this.repository.getSummaries(quoteIds, userId);
  }
}

export const reactionService = new ReactionService();
