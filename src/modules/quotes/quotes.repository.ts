import { FilterQuery } from "mongoose";
import { IQuote, Quote } from "./quotes.model";
import { QuoteReaction } from "./reaction.model";
import { QuoteComment } from "./comment.model";
import { db } from "../../config/db";
import { INITIAL_QUOTES } from "../../seed/seedData";
import { AppError } from "../../utils/appError";
import { HTTP_STATUS } from "../../constants/httpStatusCodes";

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: "latest" | "popular" | "author";
  sortOrder?: "asc" | "desc";
}

export interface MemoryQuoteItem {
  id: string;
  _id: string;
  content: string;
  author: string;
  tags: string[];
  authorSlug?: string;
  length?: number;
  likesCount: number;
  likedBy: string[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class QuoteRepository {
  private memoryQuotes: MemoryQuoteItem[] = [];

  constructor() {
    this.seedMemoryQuotes();
  }

  private requireDatabase(): void {
    if (!db.isDbConnected()) {
      throw new AppError(
        "MongoDB is unavailable. Quote data was not persisted.",
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      );
    }
  }

  private seedMemoryQuotes(): void {
    INITIAL_QUOTES.forEach((q, idx) => {
      const id = "quote_" + (idx + 1);
      this.memoryQuotes.push({
        id,
        _id: id,
        content: q.content,
        author: q.author,
        tags: [...q.tags],
        authorSlug: q.author.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        length: q.content.length,
        likesCount: q.likesCount,
        likedBy: [],
        createdAt: new Date(Date.now() - (12 - idx) * 86400000),
        updatedAt: new Date(),
      });
    });
  }

  async find(
    filter: FilterQuery<IQuote> = {},
    options: QueryOptions = {},
  ): Promise<{ quotes: any[]; total: number }> {
    this.requireDatabase();
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 50));
    const skip = (page - 1) * limit;

    if (db.isDbConnected()) {
      try {
        let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
        if (options.sortBy === "author") {
          sortOption = { author: options.sortOrder === "desc" ? -1 : 1 };
        } else if (
          options.sortOrder === "asc" &&
          options.sortBy !== "popular"
        ) {
          sortOption = { createdAt: 1 };
        }

        const quoteQuery =
          options.sortBy === "popular"
            ? Quote.aggregate([
                { $match: filter },
                {
                  $lookup: {
                    from: QuoteReaction.collection.name,
                    localField: "_id",
                    foreignField: "quoteId",
                    as: "reactions",
                  },
                },
                { $addFields: { reactionCount: { $size: "$reactions" } } },
                { $sort: { reactionCount: -1, createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
                { $project: { reactions: 0, reactionCount: 0 } },
              ])
                .exec()
                .then((items) =>
                  Quote.populate(items, {
                    path: "createdBy",
                    select: "username avatarUrl",
                  }),
                )
            : Quote.find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .populate("createdBy", "username avatarUrl")
                .exec();

        const [quotes, total] = await Promise.all([
          quoteQuery,
          Quote.countDocuments(filter).exec(),
        ]);

        return { quotes, total };
      } catch (error) {
        throw error;
      }
    }

    // In-Memory filtering
    let results = [...this.memoryQuotes];

    // Filter by $or (search query)
    if (filter.$or && Array.isArray(filter.$or)) {
      const regexPatterns = filter.$or
        .map(
          (condition) =>
            condition.content || condition.author || condition.tags,
        )
        .filter((r): r is RegExp => r instanceof RegExp);

      if (regexPatterns.length > 0) {
        results = results.filter((q) =>
          regexPatterns.some(
            (reg) =>
              reg.test(q.content) ||
              reg.test(q.author) ||
              q.tags.some((t) => reg.test(t)),
          ),
        );
      }
    }

    // Filter by tag
    if (filter.tags) {
      if (filter.tags instanceof RegExp) {
        results = results.filter((q) =>
          q.tags.some((t) => (filter.tags as RegExp).test(t)),
        );
      } else if (typeof filter.tags === "string") {
        results = results.filter((q) => q.tags.includes(filter.tags));
      }
    }

    // Filter by author
    if (filter.author && filter.author instanceof RegExp) {
      results = results.filter((q) => (filter.author as RegExp).test(q.author));
    }

    // Sorting
    if (options.sortBy === "popular") {
      results.sort((a, b) => b.likesCount - a.likesCount);
    } else if (options.sortBy === "author") {
      results.sort((a, b) =>
        options.sortOrder === "desc"
          ? b.author.localeCompare(a.author)
          : a.author.localeCompare(b.author),
      );
    } else {
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const total = results.length;
    const paginated = results.slice(skip, skip + limit);

    return { quotes: paginated, total };
  }

  async findById(id: string): Promise<any | null> {
    this.requireDatabase();
    if (db.isDbConnected()) {
      try {
        return await Quote.findById(id).exec();
      } catch (error) {
        throw error;
      }
    }
    const found = this.memoryQuotes.find((q) => q.id === id || q._id === id);
    return found || null;
  }

  async create(data: Partial<IQuote>): Promise<any> {
    this.requireDatabase();
    if (db.isDbConnected()) {
      try {
        return await Quote.create(data);
      } catch (error) {
        throw error;
      }
    }

    const id =
      "quote_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    const newQuote: MemoryQuoteItem = {
      id,
      _id: id,
      content: data.content || "",
      author: data.author || "",
      tags: data.tags || [],
      authorSlug: (data.author || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      length: (data.content || "").length,
      likesCount: 0,
      likedBy: [],
      createdBy: data.createdBy ? data.createdBy.toString() : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memoryQuotes.unshift(newQuote);
    return newQuote;
  }

  async update(id: string, data: Partial<IQuote>): Promise<any | null> {
    this.requireDatabase();
    if (db.isDbConnected()) {
      try {
        return await Quote.findByIdAndUpdate(id, data, {
          new: true,
          runValidators: true,
        }).exec();
      } catch (error) {
        throw error;
      }
    }

    const index = this.memoryQuotes.findIndex(
      (q) => q.id === id || q._id === id,
    );
    if (index === -1) return null;

    const existing = this.memoryQuotes[index];
    const updated: MemoryQuoteItem = {
      ...existing,
      content: data.content !== undefined ? data.content : existing.content,
      author: data.author !== undefined ? data.author : existing.author,
      tags: data.tags !== undefined ? [...data.tags] : existing.tags,
      updatedAt: new Date(),
    };
    this.memoryQuotes[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<any | null> {
    this.requireDatabase();
    if (db.isDbConnected()) {
      try {
        const deleted = await Quote.findByIdAndDelete(id).exec();
        if (deleted) {
          await Promise.all([
            QuoteReaction.deleteMany({ quoteId: deleted._id }).exec(),
            QuoteComment.deleteMany({ quoteId: deleted._id }).exec(),
          ]);
        }
        return deleted;
      } catch (error) {
        throw error;
      }
    }

    const index = this.memoryQuotes.findIndex(
      (q) => q.id === id || q._id === id,
    );
    if (index === -1) return null;
    const deleted = this.memoryQuotes.splice(index, 1)[0];
    return deleted;
  }

  async count(filter: FilterQuery<IQuote> = {}): Promise<number> {
    this.requireDatabase();
    if (db.isDbConnected()) {
      try {
        return await Quote.countDocuments(filter).exec();
      } catch (error) {
        throw error;
      }
    }
    return this.memoryQuotes.length;
  }

  async getDistinctTags(): Promise<{ tag: string; count: number }[]> {
    this.requireDatabase();
    if (db.isDbConnected()) {
      try {
        const result = await Quote.aggregate([
          { $match: { status: "published" } },
          { $unwind: "$tags" },
          { $group: { _id: "$tags", count: { $sum: 1 } } },
          { $project: { _id: 0, tag: "$_id", count: 1 } },
          { $sort: { count: -1, tag: 1 } },
        ]);
        return result;
      } catch (error) {
        throw error;
      }
    }

    const tagCountMap = new Map<string, number>();
    this.memoryQuotes.forEach((q) => {
      q.tags.forEach((t) => {
        tagCountMap.set(t, (tagCountMap.get(t) || 0) + 1);
      });
    });

    return Array.from(tagCountMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  async insertMany(quotes: Partial<IQuote>[]): Promise<any[]> {
    this.requireDatabase();
    if (db.isDbConnected()) {
      try {
        return (await Quote.insertMany(quotes)) as any;
      } catch (error) {
        throw error;
      }
    }
    quotes.forEach((q) => {
      this.create(q);
    });
    return this.memoryQuotes;
  }
}

export const quoteRepository = new QuoteRepository();
