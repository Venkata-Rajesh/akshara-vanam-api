import { FilterQuery, Types } from "mongoose";
import { quoteRepository, QuoteRepository } from "./quotes.repository";
import { IQuote } from "./quotes.model";
import {
  CreateQuoteInput,
  QueryQuotesInput,
  UpdateQuoteInput,
} from "./quotes.validation";
import { NotFoundError, ForbiddenError } from "../../utils/appError";
import { MESSAGES } from "../../constants/messages";
import { UserContext } from "../../types";

export class QuotesService {
  constructor(private repo: QuoteRepository = quoteRepository) {}

  async getQuotes(params: QueryQuotesInput) {
    const filter: FilterQuery<IQuote> = {};

    // 1. Text Search / Query filter
    if (params.q && params.q.trim()) {
      const searchRegex = new RegExp(params.q.trim(), "i");
      filter.$or = [
        { content: searchRegex },
        { author: searchRegex },
        { tags: searchRegex },
      ];
    }

    // 2. Tag filter
    if (params.tag && params.tag.trim()) {
      filter.tags = new RegExp(`^${params.tag.trim()}$`, "i");
    }

    // 3. Author filter
    if (params.author && params.author.trim()) {
      filter.author = new RegExp(params.author.trim(), "i");
    }

    const { quotes, total } = await this.repo.find(filter, {
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });

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

  async getQuoteById(id: string): Promise<IQuote> {
    const quote = await this.repo.findById(id);
    if (!quote) {
      throw new NotFoundError(MESSAGES.QUOTES.NOT_FOUND);
    }
    return quote;
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
    const quote = await this.getQuoteById(id);

    // Authorization: only creator or admin can update
    if (
      quote.createdBy &&
      quote.createdBy.toString() !== user.id &&
      user.role !== "admin"
    ) {
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

    const updated = await this.repo.update(id, updateData);
    if (!updated) {
      throw new NotFoundError(MESSAGES.QUOTES.NOT_FOUND);
    }
    return updated;
  }

  async deleteQuote(id: string, user: UserContext): Promise<void> {
    const quote = await this.getQuoteById(id);

    // Authorization: only creator or admin can delete
    if (
      quote.createdBy &&
      quote.createdBy.toString() !== user.id &&
      user.role !== "admin"
    ) {
      throw new ForbiddenError(MESSAGES.AUTH.FORBIDDEN);
    }

    await this.repo.delete(id);
  }

  async toggleLike(id: string, userId: string) {
    const result = await this.repo.toggleLike(id, userId);
    if (!result) {
      throw new NotFoundError(MESSAGES.QUOTES.NOT_FOUND);
    }
    return result;
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
