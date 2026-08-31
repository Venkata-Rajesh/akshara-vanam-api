import { Response } from 'express';
import { HTTP_STATUS, HttpStatusCode } from '../constants/httpStatusCodes';
import { ApiResponseFormat, PaginationMeta } from '../types';

export class ApiResponse {
  public static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode: HttpStatusCode = HTTP_STATUS.OK,
    meta?: PaginationMeta | Record<string, any>
  ): Response {
    const payload: ApiResponseFormat<T> = {
      status: 'success',
      statusCode,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }

  public static created<T>(
    res: Response,
    data: T,
    message = 'Created successfully',
    meta?: Record<string, any>
  ): Response {
    return ApiResponse.success(res, data, message, HTTP_STATUS.CREATED, meta);
  }

  public static error(
    res: Response,
    message = 'Error',
    statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors?: any[]
  ): Response {
    const payload: ApiResponseFormat = {
      status: 'error',
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }
}
