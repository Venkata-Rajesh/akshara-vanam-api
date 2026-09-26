import { Types } from "mongoose";
import { ForbiddenError, NotFoundError } from "../../utils/appError";
import { UserContext } from "../../types";
import { Quote } from "./quotes.model";
import { CommentStatus } from "./comment.model";
import { CommentRepository, commentRepository } from "./comment.repository";

export class CommentService {
  constructor(private repository: CommentRepository = commentRepository) {}

  async list(
    quoteId: string,
    page: number,
    limit: number,
    status: "visible" | "hidden" = "visible",
  ) {
    await this.requirePublishedQuote(quoteId);
    const { comments, total } = await this.repository.list(
      quoteId,
      page,
      limit,
      status,
    );
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      comments,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async create(quoteId: string, userId: string, body: string) {
    await this.requirePublishedQuote(quoteId);
    return this.repository.create({ quoteId, userId, body: body.trim() });
  }

  async update(commentId: string, body: string, user: UserContext) {
    const comment = await this.requireComment(commentId);
    const isOwner = comment.userId.toString() === user.id;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) throw new ForbiddenError();
    if (!isAdmin && comment.status !== "visible")
      throw new NotFoundError("Comment not found");
    return this.repository.updateBody(commentId, body.trim());
  }

  async delete(commentId: string, user: UserContext) {
    const comment = await this.requireComment(commentId);
    const isOwner = comment.userId.toString() === user.id;
    if (!isOwner && user.role !== "admin") throw new ForbiddenError();
    return this.repository.setStatus(commentId, "deleted");
  }

  async moderate(commentId: string, status: CommentStatus) {
    await this.requireComment(commentId);
    return this.repository.setStatus(commentId, status);
  }

  private async requirePublishedQuote(quoteId: string): Promise<void> {
    const quote = await Quote.exists({ _id: quoteId, status: "published" });
    if (!quote) throw new NotFoundError("Quote not found");
  }

  private async requireComment(commentId: string) {
    if (!Types.ObjectId.isValid(commentId))
      throw new NotFoundError("Comment not found");
    const comment = await this.repository.findById(commentId);
    if (!comment || comment.status === "deleted") {
      throw new NotFoundError("Comment not found");
    }
    return comment;
  }
}

export const commentService = new CommentService();
