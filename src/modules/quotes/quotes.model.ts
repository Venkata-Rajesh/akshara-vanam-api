import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IQuote extends Document {
  title?: string;
  content: string;
  author: string;
  tags: string[];
  language?: "english" | "telugu";
  transliterationMode?: "native" | "roman";
  status: "pending" | "published" | "rejected";
  moderatedAt?: Date;
  moderatedBy?: Types.ObjectId;
  moderationNote?: string;
  authorSlug?: string;
  length?: number;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const quoteSchema = new Schema<IQuote>(
  {
    title: {
      type: String,
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    content: {
      type: String,
      required: [true, "Quote content is required"],
      trim: true,
      minlength: [5, "Quote content must be at least 5 characters"],
      maxlength: [1000, "Quote content cannot exceed 1000 characters"],
    },
    author: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
      minlength: [2, "Author name must be at least 2 characters"],
      maxlength: [100, "Author name cannot exceed 100 characters"],
    },
    tags: {
      type: [String],
      required: [true, "At least one tag is required"],
      index: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: "A quote must have at least one tag",
      },
    },
    language: {
      type: String,
      enum: ["english", "telugu"],
      default: "english",
      index: true,
    },
    transliterationMode: {
      type: String,
      enum: ["native", "roman"],
      default: "native",
    },
    status: {
      type: String,
      enum: ["pending", "published", "rejected"],
      default: "pending",
      index: true,
    },
    moderatedAt: {
      type: Date,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    moderationNote: {
      type: String,
      trim: true,
      maxlength: [500, "Moderation note cannot exceed 500 characters"],
    },
    authorSlug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    length: {
      type: Number,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret._id = ret.id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Auto compute length and authorSlug on save
quoteSchema.pre("save", function (next) {
  if (this.content) {
    this.length = this.content.length;
  }
  if (this.author && !this.authorSlug) {
    this.authorSlug = this.author
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

// Indexes for high performance (tags is indexed in schema definition)
quoteSchema.index(
  { content: "text", author: "text" },
  { default_language: "english", language_override: "textSearchLanguage" },
);
quoteSchema.index({ createdAt: -1 });
quoteSchema.index({ status: 1, createdAt: -1 });

export const Quote: Model<IQuote> = mongoose.model<IQuote>(
  "Quote",
  quoteSchema,
);
