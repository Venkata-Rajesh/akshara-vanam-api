import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware";
import { commentRateLimiter } from "../../middlewares/rateLimiter.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { commentsController } from "./comments.controller";
import {
  createCommentSchema,
  listCommentsSchema,
  moderateCommentSchema,
  updateCommentSchema,
} from "./comment.validation";

const router = Router({ mergeParams: true });

router.get("/", validate(listCommentsSchema), commentsController.list);
router.get(
  "/hidden",
  requireAuth,
  requireRole(["admin"]),
  validate(listCommentsSchema),
  commentsController.listHidden,
);
router.post(
  "/",
  requireAuth,
  commentRateLimiter,
  validate(createCommentSchema),
  commentsController.create,
);
router.patch(
  "/:commentId",
  requireAuth,
  validate(updateCommentSchema),
  commentsController.update,
);
router.delete(
  "/:commentId",
  requireAuth,
  validate(updateCommentSchema.omit({ body: true })),
  commentsController.delete,
);
router.patch(
  "/:commentId/moderation",
  requireAuth,
  requireRole(["admin"]),
  validate(moderateCommentSchema),
  commentsController.moderate,
);

export const commentsRoutes = router;
