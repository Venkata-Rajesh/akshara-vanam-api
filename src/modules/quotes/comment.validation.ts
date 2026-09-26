import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-f]{24}$/i, "Invalid ID");

export const listCommentsSchema = z.object({
  params: z.object({ quoteId: objectId }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export const createCommentSchema = z.object({
  params: z.object({ quoteId: objectId }),
  body: z.object({
    body: z.string().trim().min(1).max(1500),
    language: z.enum(["english", "telugu"]).default("english"),
  }),
});

export const updateCommentSchema = z.object({
  params: z.object({ commentId: objectId }),
  body: z.object({
    body: z.string().trim().min(1).max(1500),
  }),
});

export const moderateCommentSchema = z.object({
  params: z.object({ commentId: objectId }),
  body: z.object({
    status: z.enum(["visible", "hidden"]),
  }),
});
