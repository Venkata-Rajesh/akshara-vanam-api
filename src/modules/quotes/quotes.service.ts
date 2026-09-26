import { FilterQuery, Types } from "mongoose";
import { quoteRepository, QuoteRepository } from "./quotes.repository";
import { IQuote } from "./quotes.model";
import {
  CreateQuoteInput,
  QueryQuotesInput,
  ReviewQuoteInput,
  UpdateQuoteInput,
} from "./quotes.validation";
import { NotFoundError, ForbiddenError } from "../../utils/appError";
import { MESSAGES } from "../../constants/messages";
import { UserContext } from "../../types";
import { ReactionType } from "./reaction.model";
import { ReactionService, reactionService } from "./reaction.service";
import {
  canManageQuote,
  canViewQuote,
  statusAfterQuoteEdit,
  submissionStatus,
} from "./quote.policy";

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class QuotesService {
  constructor(
    private repo: QuoteRepository = quoteRepository,
    private reactions: ReactionService = reactionService,
  ) {}

  async getQuotes(params: QueryQuotesInput, user?: UserContext) {
    const filter: FilterQuery<IQuote> = { status: "published" };

    // 1. Text Search / Query filter
    if (params.q && params.q.trim()) {
      const searchRegex = new RegExp(escapeRegex(params.q.trim()), "i");
      filter.$or = [
        { content: searchRegex },
        { author: searchRegex },
        { tags: searchRegex },
      ];
    }

    // 2. Tag filter
    if (params.tag && params.tag.trim()) {
      filter.tags = new RegExp(`^${escapeRegex(params.tag.trim())}$`, "i");
    }

    // 3. Author filter
    if (params.author && params.author.trim()) {
      filter.author = new RegExp(escapeRegex(params.author.trim()), "i");
    }

    const { quotes, total } = await this.repo.find(filter, {
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    const summaries = await this.reactions.getSummaries(
      quotes.map((quote) => quote._id.toString()),
      user?.id,
    );
    const enrichedQuotes = quotes.map((quote) => {
      const plainQuote =
        typeof quote.toJSON === "function" ? quote.toJSON() : quote;
      return { ...plainQuote, ...summaries[quote._id.toString()] };
    });

    const totalPages = Math.ceil(total / params.limit) || 1;

    return {
      quotes: enrichedQuotes,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages,
        hasNextPage: params.page < totalPages,
        hasPrevPage: params.page > 1,
      },
    };
  }

  async getPendingQuotes(params: QueryQuotesInput) {
    const { quotes, total } = await this.repo.find(
      { status: "pending" },
      {
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
    );
    const totalPages = Math.ceil(total / params.limit) || 1;

    return {
      quotes,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages,
        hasNextPage: params.page < totalPages,
        hasPrevPage: params.page > 1,
      },
    };
  }

  async getQuoteById(id: string, user?: UserContext): Promise<IQuote> {
    const quote = await this.repo.findById(id);
    if (!quote) {
      throw new NotFoundError(MESSAGES.QUOTES.NOT_FOUND);
    }
    const ownerId = quote.createdBy?.toString();
    if (!canViewQuote(quote.status, ownerId, user)) {
      throw new NotFoundError(MESSAGES.QUOTES.NOT_FOUND);
    }
    const summary = await this.reactions.getSummaries([id], user?.id);
    const plainQuote =
      typeof quote.toJSON === "function" ? quote.toJSON() : quote;
    return { ...plainQuote, ...summary[id] } as IQuote;
  }

  async createQuote(
    input: CreateQuoteInput,
    user?: UserContext,
  ): Promise<IQuote> {
    const quoteData: Partial<IQuote> = {
      title: input.title?.trim() || undefined,
      content: input.content.trim(),
      author: input.author.trim(),
      tags: input.tags.map((t) => t.trim()),
      language: input.language || "english",
      transliterationMode: input.transliterationMode || "native",
      status: submissionStatus(user?.role),
      createdBy:
        user && Types.ObjectId.isValid(user.id)
          ? new Types.ObjectId(user.id)
          : undefined,
    };

    return this.repo.create(quoteData);
  }

  async updateQuote(
    id: string,
    input: UpdateQuoteInput,
    user: UserContext,
  ): Promise<IQuote> {
    const quote = await this.getQuoteById(id, user);

    const isAdmin = user.role === "admin";
    const ownerId = quote.createdBy?.toString();
    if (!canManageQuote(ownerId, user)) {
      throw new ForbiddenError(MESSAGES.AUTH.FORBIDDEN);
    }

    const updateData: Partial<IQuote> = {};
    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.content !== undefined) updateData.content = input.content.trim();
    if (input.author !== undefined) updateData.author = input.author.trim();
    if (input.tags !== undefined)
      updateData.tags = input.tags.map((t) => t.trim());
    if (input.language !== undefined) updateData.language = input.language;
    if (input.transliterationMode !== undefined)
      updateData.transliterationMode = input.transliterationMode;
    updateData.status = statusAfterQuoteEdit(quote.status, user.role);

    const updated = await this.repo.update(id, updateData);
    if (!updated) {
      throw new NotFoundError(MESSAGES.QUOTES.NOT_FOUND);
    }
    return updated;
  }

  async reviewQuote(
    id: string,
    input: ReviewQuoteInput,
    admin: UserContext,
  ): Promise<IQuote> {
    const quote = await this.repo.findById(id);
    if (!quote) throw new NotFoundError(MESSAGES.QUOTES.NOT_FOUND);

    const reviewed = await this.repo.update(id, {
      status: input.status,
      moderatedAt: new Date(),
      moderatedBy: new Types.ObjectId(admin.id),
      moderationNote: input.moderationNote?.trim(),
    });
    if (!reviewed) throw new NotFoundError(MESSAGES.QUOTES.NOT_FOUND);
    return reviewed;
  }

  async deleteQuote(id: string, user: UserContext): Promise<void> {
    const quote = await this.getQuoteById(id, user);

    const ownerId = quote.createdBy?.toString();
    if (!canManageQuote(ownerId, user)) {
      throw new ForbiddenError(MESSAGES.AUTH.FORBIDDEN);
    }

    await this.repo.delete(id);
  }

  async setReaction(id: string, userId: string, type: ReactionType | null) {
    return this.reactions.setReaction(id, userId, type);
  }

  async getTags(): Promise<{ tag: string; count: number }[]> {
    return this.repo.getDistinctTags();
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async seedQuotes(seedData: Partial<IQuote>[]): Promise<void> {
    const existingCount = await this.count();
    if (existingCount === 0) {
      await this.repo.insertMany(seedData);
    }
  }
}

export const quotesService = new QuotesService();
