import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    username: z
      .string({ required_error: "Username is required" })
      .min(2, "Username must be at least 2 characters")
      .max(50, "Username cannot exceed 50 characters"),
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email address format"),
    password: z
      .string({ required_error: "Password is required" })
      .min(12, "Password must be at least 12 characters"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email address format"),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email address format"),
  }),
});

export const resetPasswordSchema = z.object({
  params: z.object({ token: z.string().min(32, "Invalid reset token") }),
  body: z.object({
    password: z
      .string({ required_error: "Password is required" })
      .min(12, "Password must be at least 12 characters"),
  }),
});

export type SignupInput = z.infer<typeof signupSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
