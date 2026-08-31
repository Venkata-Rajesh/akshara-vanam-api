import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

class Database {
  private static instance: Database;
  private isConnected = false;

  private constructor() {
    this.setupListeners();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private setupListeners(): void {
    mongoose.connection.on("connected", () => {
      this.isConnected = true;
      logger.info("✅ MongoDB connection established successfully.");
    });

    mongoose.connection.on("error", (err) => {
      this.isConnected = false;
      logger.warn(
        "⚠️ MongoDB connection issue (operating with resilient storage mode):",
        err?.message || err,
      );
    });

    mongoose.connection.on("disconnected", () => {
      this.isConnected = false;
      logger.warn("⚠️ MongoDB disconnected.");
    });
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      logger.info(
        `Connecting to MongoDB at: ${env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`,
      );
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 2000,
        autoIndex: true,
      });
      this.isConnected = true;
    } catch (error: any) {
      this.isConnected = false;
      logger.warn(
        `⚠️ MongoDB connection unavailable (${error.message}). Server startup aborted.`,
      );
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info("MongoDB connection closed.");
    } catch (error) {
      logger.error("Error while disconnecting MongoDB:", error);
    }
  }

  public isDbConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  public getStatus(): "connected" | "connecting" | "disconnected" {
    const state = mongoose.connection.readyState;
    switch (state) {
      case 1:
        return "connected";
      case 2:
        return "connecting";
      default:
        return "disconnected";
    }
  }
}

export const db = Database.getInstance();
