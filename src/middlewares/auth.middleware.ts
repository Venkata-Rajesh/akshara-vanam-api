import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/appError';
import { verifyToken } from '../utils/jwt';
import { MESSAGES } from '../constants/messages';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED));
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError(MESSAGES.AUTH.TOKEN_EXPIRED));
    }
    return next(new UnauthorizedError('Invalid authentication token.'));
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const payload = verifyToken(token);
        req.user = {
          id: payload.userId,
          email: payload.email,
          username: payload.username,
          role: payload.role,
        };
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
