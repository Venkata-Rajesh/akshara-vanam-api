import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from './auth.validation';
import { requireAuth } from '../../middlewares/auth.middleware';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/signup', authRateLimiter, validate(signupSchema), authController.signup);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password/:token', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', requireAuth, authController.getProfile);

export const authRoutes = router;
