import { Router } from 'express';
import { quotesController } from './quotes.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createQuoteSchema,
  queryQuotesSchema,
  quoteIdSchema,
  updateQuoteSchema,
} from './quotes.validation';
import { requireAuth, optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

// Public / optionally authenticated routes
router.get('/', optionalAuth, validate(queryQuotesSchema), quotesController.getQuotes);
router.get('/tags', quotesController.getTags);
router.get('/:id', validate(quoteIdSchema), quotesController.getQuoteById);

// Protected routes
router.post('/', requireAuth, validate(createQuoteSchema), quotesController.createQuote);
router.put('/:id', requireAuth, validate(updateQuoteSchema), quotesController.updateQuote);
router.delete('/:id', requireAuth, validate(quoteIdSchema), quotesController.deleteQuote);
router.post('/:id/like', requireAuth, validate(quoteIdSchema), quotesController.toggleLike);

export const quotesRoutes = router;
