import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type ReactionType = "like" | "dislike";

export interface IQuoteReaction extends Document {
  quoteId: Types.ObjectId;
  userId: Types.ObjectId;
  type: ReactionType;
  createdAt: Date;
  updatedAt: Date;
}

const quoteReactionSchema = new Schema<IQuoteReaction>(
  {
    quoteId: {
      type: Schema.Types.ObjectId,
      ref: "Quote",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "dislike"],
      required: true,
    },
  },
  { timestamps: true },
);

quoteReactionSchema.index({ quoteId: 1, userId: 1 }, { unique: true });
quoteReactionSchema.index({ quoteId: 1, type: 1 });

export const QuoteReaction: Model<IQuoteReaction> =
  mongoose.models.QuoteReaction ||
  mongoose.model<IQuoteReaction>("QuoteReaction", quoteReactionSchema);
