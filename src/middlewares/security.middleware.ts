import cors from "cors";
import helmet from "helmet";
import express, { Express } from "express";
import morgan from "morgan";
import { env } from "../config/env";

export const configureSecurityMiddlewares = (app: Express): void => {
  // 1. Helmet security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // 2. CORS configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    }),
  );

  // 3. Body parsers
  app.use(express.json({ limit: "64kb" }));
  app.use(express.urlencoded({ extended: true, limit: "64kb" }));

  // 4. Request logger
  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
  }
};
