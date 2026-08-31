import express, { Express, Request, Response } from 'express';
import { configureSecurityMiddlewares } from './middlewares/security.middleware';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { quotesRoutes } from './modules/quotes/quotes.routes';
import { ApiResponse } from './utils/apiResponse';
import { db } from './config/db';

export const createApp = (): Express => {
  const app: Express = express();

  // 1. Security & Body Parsing Middlewares
  configureSecurityMiddlewares(app);

  // 2. Global Rate Limiter
  app.use(globalRateLimiter);

  // 3. Health Check Endpoint
  app.get('/health', (req: Request, res: Response) => {
    return ApiResponse.success(res, {
      status: 'healthy',
      service: 'editor-service',
      uptime: process.uptime(),
      db: db.getStatus(),
      timestamp: new Date().toISOString(),
    });
  });

  // 4. API v1 Versioned Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/quotes', quotesRoutes);

  // 5. Backwards-compatibility root endpoints (for existing client integrations)
  app.use('/signup', authRoutes);
  app.use('/login', authRoutes);
  app.use('/quotes', quotesRoutes);

  // 6. 404 Not Found Middleware
  app.use(notFoundHandler);

  // 7. Global Centralized Error Handler Middleware
  app.use(errorHandler);

  return app;
};
