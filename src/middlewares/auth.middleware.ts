import { NextFunction, Request, Response } from "express";
import { UnauthorizedError, ForbiddenError } from "../utils/appError";
import { verifyToken } from "../utils/jwt";
import { MESSAGES } from "../constants/messages";
import { Types } from "mongoose";
import { userRepository } from "../modules/users/users.repository";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED));
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED));
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return next(new UnauthorizedError(MESSAGES.AUTH.TOKEN_EXPIRED));
    }
    return next(new UnauthorizedError("Invalid authentication token."));
  }

  if (!Types.ObjectId.isValid(payload.userId)) {
    return next(new UnauthorizedError("Invalid authentication token."));
  }

  try {
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      return next(new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED));
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      try {
        const payload = verifyToken(token);
        if (Types.ObjectId.isValid(payload.userId)) {
          const user = await userRepository.findById(payload.userId);
          if (user) {
            req.user = {
              id: user._id.toString(),
              email: user.email,
              username: user.username,
              role: user.role,
            };
          }
        }
      } catch {
        // Optional auth: continue without setting req.user if token is invalid
      }
    }
  }

  next();
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED));
    }
    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(MESSAGES.AUTH.FORBIDDEN));
    }
    next();
  };
};
