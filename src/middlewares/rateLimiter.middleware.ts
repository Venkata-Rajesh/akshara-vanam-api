import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants/httpStatusCodes';

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(
      res,
      'Too many requests created from this IP, please try again after 15 minutes',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 25, // limit each IP to 25 auth attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(
      res,
      'Too many login attempts from this IP, please try again after 15 minutes',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  },
});
