import { z } from "zod";

export const createQuoteSchema = z.object({
  body: z.object({
    title: z.string().max(120, "Title cannot exceed 120 characters").optional(),
    content: z
      .string({ required_error: "Quote content is required" })
      .min(5, "Content must be at least 5 characters")
      .max(1000, "Content cannot exceed 1000 characters"),
    author: z
      .string({ required_error: "Author is required" })
      .min(2, "Author must be at least 2 characters")
      .max(100, "Author cannot exceed 100 characters"),
    tags: z
      .array(z.string().min(1, "Tag cannot be empty"))
      .min(1, "At least one tag is required"),
    language: z.enum(["english", "telugu"]).default("english").optional(),
    transliterationMode: z
      .enum(["native", "roman"])
      .default("native")
      .optional(),
  }),
});

export const updateQuoteSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Quote ID is required" }),
  }),
  body: z.object({
    title: z.string().max(120, "Title cannot exceed 120 characters").optional(),
    content: z
      .string()
      .min(5, "Content must be at least 5 characters")
      .max(1000, "Content cannot exceed 1000 characters")
      .optional(),
    author: z
      .string()
      .min(2, "Author must be at least 2 characters")
      .max(100, "Author cannot exceed 100 characters")
      .optional(),
    tags: z
      .array(z.string().min(1, "Tag cannot be empty"))
      .min(1, "At least one tag is required")
      .optional(),
    language: z.enum(["english", "telugu"]).optional(),
    transliterationMode: z.enum(["native", "roman"]).optional(),
  }),
});

export const queryQuotesSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    tag: z.string().optional(),
    author: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(50),
    sortBy: z.enum(["latest", "popular", "author"]).default("latest"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

export const quoteIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Quote ID is required" }),
  }),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>["body"];
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>["body"];
export type QueryQuotesInput = z.infer<typeof queryQuotesSchema>["query"];
