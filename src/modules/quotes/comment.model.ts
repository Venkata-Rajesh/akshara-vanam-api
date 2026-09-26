import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type CommentStatus = "visible" | "hidden" | "deleted";
export type CommentLanguage = "english" | "telugu";

export interface IQuoteComment extends Document {
  quoteId: Types.ObjectId;
  userId: Types.ObjectId;
  body: string;
  language: CommentLanguage;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const quoteCommentSchema = new Schema<IQuoteComment>(
  {
    quoteId: {
      type: Schema.Types.ObjectId,
      ref: "Quote",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [1500, "Comment cannot exceed 1500 characters"],
    },
    language: {
      type: String,
      enum: ["english", "telugu"],
      default: "english",
    },
    status: {
      type: String,
      enum: ["visible", "hidden", "deleted"],
      default: "visible",
    },
  },
  { timestamps: true },
);

quoteCommentSchema.index({ quoteId: 1, status: 1, createdAt: -1 });

export const QuoteComment: Model<IQuoteComment> =
  mongoose.models.QuoteComment ||
  mongoose.model<IQuoteComment>("QuoteComment", quoteCommentSchema);
