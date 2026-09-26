import { Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { CommentService, commentService } from "./comment.service";

const routeParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : value || "";

export class CommentsController {
  constructor(private service: CommentService = commentService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.list(
      routeParam(req.params.quoteId),
      Number(req.query.page || 1),
      Number(req.query.limit || 20),
    );
    return ApiResponse.success(
      res,
      result.comments,
      "Comments fetched.",
      200,
      result.meta,
    );
  });

  listHidden = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.list(
      routeParam(req.params.quoteId),
      Number(req.query.page || 1),
      Number(req.query.limit || 20),
      "hidden",
    );
    return ApiResponse.success(
      res,
      result.comments,
      "Hidden comments fetched.",
      200,
      result.meta,
    );
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const comment = await this.service.create(
      routeParam(req.params.quoteId),
      req.user!.id,
      req.body.body,
      req.body.language,
    );
    return ApiResponse.created(res, comment, "Comment added.");
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const comment = await this.service.update(
      routeParam(req.params.commentId),
      req.body.body,
      req.user!,
    );
    return ApiResponse.success(res, comment, "Comment updated.");
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.service.delete(routeParam(req.params.commentId), req.user!);
    return ApiResponse.success(res, null, "Comment deleted.");
  });

  moderate = asyncHandler(async (req: Request, res: Response) => {
    const comment = await this.service.moderate(
      routeParam(req.params.commentId),
      req.body.status,
    );
    return ApiResponse.success(res, comment, "Comment moderation updated.");
  });
}

export const commentsController = new CommentsController();
