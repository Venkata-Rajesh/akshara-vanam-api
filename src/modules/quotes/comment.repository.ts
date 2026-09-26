import { Types } from "mongoose";
import { QuoteComment, CommentStatus } from "./comment.model";

export class CommentRepository {
  async list(
    quoteId: string,
    page: number,
    limit: number,
    status: "visible" | "hidden" = "visible",
  ) {
    const filter = { quoteId: new Types.ObjectId(quoteId), status };
    const [comments, total] = await Promise.all([
      QuoteComment.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "username avatarUrl")
        .exec(),
      QuoteComment.countDocuments(filter).exec(),
    ]);
    return { comments, total };
  }

  create(data: { quoteId: string; userId: string; body: string }) {
    return QuoteComment.create({
      quoteId: new Types.ObjectId(data.quoteId),
      userId: new Types.ObjectId(data.userId),
      body: data.body,
    }).then((comment) => comment.populate("userId", "username avatarUrl"));
  }

  findById(id: string) {
    return QuoteComment.findById(id).exec();
  }

  updateBody(id: string, body: string) {
    return QuoteComment.findByIdAndUpdate(
      id,
      { $set: { body } },
      { new: true, runValidators: true },
    ).exec();
  }

  setStatus(id: string, status: CommentStatus) {
    return QuoteComment.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true },
    ).exec();
  }
}

export const commentRepository = new CommentRepository();
