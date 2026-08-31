import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants/httpStatusCodes';
import { logger } from '../config/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // Log error stack in development / warnings in production
  if (env.NODE_ENV === 'development') {
    logger.error(`[${req.method}] ${req.originalUrl} - Error:`, err);
  } else {
    logger.error(`[${req.method}] ${req.originalUrl} - ${err.message || 'Internal Server Error'}`);
  }

  // 1. Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new AppError(message, HTTP_STATUS.NOT_FOUND);
  }

  // 2. Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    error = new AppError(message, HTTP_STATUS.CONFLICT);
  }

  // 3. Mongoose Validation Error
  if (err.name === 'ValidationError' && !err.isOperational) {
    const errors = Object.values(err.errors || {}).map((val: any) => ({
      field: val.path,
      message: val.message,
    }));
    error = new AppError('Validation Error', HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
  }

  // 4. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token', HTTP_STATUS.UNAUTHORIZED);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Authentication token expired', HTTP_STATUS.UNAUTHORIZED);
  }

  // 5. Send standardized response
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || 'An unexpected error occurred on the server.';
  const errors = error.errors || (env.NODE_ENV === 'development' && err.stack ? [{ stack: err.stack }] : undefined);

  ApiResponse.error(res, message, statusCode, errors);
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  ApiResponse.error(res, `Route ${req.originalUrl} not found`, HTTP_STATUS.NOT_FOUND);
};
