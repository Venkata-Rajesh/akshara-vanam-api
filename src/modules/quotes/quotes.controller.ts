import { Request, Response } from 'express';
import { quotesService, QuotesService } from './quotes.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { MESSAGES } from '../../constants/messages';

export class QuotesController {
  constructor(private service: QuotesService = quotesService) {}

  getQuotes = asyncHandler(async (req: Request, res: Response) => {
    const { quotes, meta } = await this.service.getQuotes(req.query as any);
    return ApiResponse.success(res, quotes, MESSAGES.QUOTES.FETCH_SUCCESS, 200, meta);
  });

  getQuoteById = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const quote = await this.service.getQuoteById(id);
    return ApiResponse.success(res, quote, MESSAGES.QUOTES.FETCH_ONE_SUCCESS);
  });

  createQuote = asyncHandler(async (req: Request, res: Response) => {
    const quote = await this.service.createQuote(req.body, req.user);
    return ApiResponse.created(res, quote, MESSAGES.QUOTES.CREATE_SUCCESS);
  });

  updateQuote = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const quote = await this.service.updateQuote(id, req.body, req.user!);
    return ApiResponse.success(res, quote, MESSAGES.QUOTES.UPDATE_SUCCESS);
  });

  deleteQuote = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await this.service.deleteQuote(id, req.user!);
    return ApiResponse.success(res, null, MESSAGES.QUOTES.DELETE_SUCCESS);
  });

  getTags = asyncHandler(async (req: Request, res: Response) => {
    const tags = await this.service.getTags();
    return ApiResponse.success(res, tags, MESSAGES.QUOTES.TAGS_FETCH_SUCCESS);
  });

  toggleLike = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.toggleLike(id, req.user!.id);
    return ApiResponse.success(res, result, MESSAGES.QUOTES.LIKE_SUCCESS);
  });
}

export const quotesController = new QuotesController();
