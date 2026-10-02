import { Request, Response } from "express";
import { authService, AuthService } from "./auth.service";
import { ApiResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

export class AuthController {
  constructor(private service: AuthService = authService) {}

  signup = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.signup(req.body);
    return ApiResponse.created(res, result, result.message);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.login(req.body);
    return ApiResponse.success(res, result, result.message);
  });

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.service.getProfile(req.user!.id);
    return ApiResponse.success(res, user, "Profile retrieved successfully");
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.requestPasswordReset(req.body);
    return ApiResponse.success(
      res,
      result,
      "If an account exists, reset instructions are available.",
    );
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const token = Array.isArray(req.params.token)
      ? req.params.token[0]
      : req.params.token;
    await this.service.resetPassword(token, req.body);
    return ApiResponse.success(res, null, "Password reset successfully.");
  });
}

export const authController = new AuthController();
