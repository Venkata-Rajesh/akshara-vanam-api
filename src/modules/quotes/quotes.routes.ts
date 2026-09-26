import { Router } from "express";
import { quotesController } from "./quotes.controller";
import { validate } from "../../middlewares/validate.middleware";
import {
  createQuoteSchema,
  queryQuotesSchema,
  quoteIdSchema,
  reviewQuoteSchema,
  setReactionSchema,
  updateQuoteSchema,
} from "./quotes.validation";
import {
  requireAuth,
  optionalAuth,
  requireRole,
} from "../../middlewares/auth.middleware";
import { quoteSubmissionRateLimiter } from "../../middlewares/rateLimiter.middleware";
import { commentsRoutes } from "./comments.routes";

const router = Router();

// Public / optionally authenticated routes
router.get(
  "/",
  optionalAuth,
  validate(queryQuotesSchema),
  quotesController.getQuotes,
);
router.get("/tags", quotesController.getTags);
router.get(
  "/review/pending",
  requireAuth,
  requireRole(["admin"]),
  validate(queryQuotesSchema),
  quotesController.getPendingQuotes,
);
router.get(
  "/:id",
  optionalAuth,
  validate(quoteIdSchema),
  quotesController.getQuoteById,
);
router.use("/:quoteId/comments", commentsRoutes);

// Public submissions remain hidden until an admin approves them.
router.post(
  "/",
  quoteSubmissionRateLimiter,
  optionalAuth,
  validate(createQuoteSchema),
  quotesController.createQuote,
);
router.put(
  "/:id",
  requireAuth,
  validate(updateQuoteSchema),
  quotesController.updateQuote,
);
router.delete(
  "/:id",
  requireAuth,
  validate(quoteIdSchema),
  quotesController.deleteQuote,
);
router.patch(
  "/:id/review",
  requireAuth,
  requireRole(["admin"]),
  validate(reviewQuoteSchema),
  quotesController.reviewQuote,
);
router.put(
  "/:id/reaction",
  requireAuth,
  validate(setReactionSchema),
  quotesController.setReaction,
);

export const quotesRoutes = router;
