import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z
  .object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_SECRET: z
      .string()
      .min(32, "JWT_SECRET must be at least 32 characters long")
      .refine(
        (secret) =>
          secret !== "inspirehub_enterprise_super_secret_jwt_key_2026" &&
          !secret.startsWith("replace-with-"),
        "JWT_SECRET must be a unique secret, not a sample value",
      ),
    JWT_EXPIRES_IN: z.string().default("7d"),
    CORS_ORIGIN: z.string().optional(),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 mins
    RATE_LIMIT_MAX: z.coerce.number().default(100),
  })
  .superRefine((config, context) => {
    if (
      config.NODE_ENV === "production" &&
      (!config.CORS_ORIGIN || config.CORS_ORIGIN.trim() === "*")
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ORIGIN"],
        message: "Set explicit frontend origins in production",
      });
    }
  })
  .transform((config) => ({
    ...config,
    CORS_ORIGIN: config.CORS_ORIGIN || "http://localhost:4200",
  }));

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsedEnv.error.format(), null, 2),
  );
  process.exit(1);
}

export const env = parsedEnv.data;
