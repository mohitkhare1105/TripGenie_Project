import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * In-Memory Rate Limiter for expensive AI-generation and optimization endpoints.
 *
 * ARCHITECTURAL NOTE:
 * This limiter maintains client counters in server process memory.
 * - Counters reset upon server restart.
 * - In multi-instance / clustered deployments, each replica tracks counters independently.
 * This provides robust, zero-dependency abuse protection suitable for single-instance
 * or small-scale container deployments without requiring Redis.
 */
export const createRateLimiter = (options?: {
  windowMs?: number;
  max?: number;
}) => {
  const isRunningTests =
    process.env.NODE_ENV === 'test' ||
    process.argv.includes('--test') ||
    process.argv.some((arg) => arg.includes('.test.'));

  const windowMs =
    options?.windowMs ||
    (process.env.RATE_LIMIT_WINDOW_MS
      ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
      : 15 * 60 * 1000); // Default: 15 minutes

  const defaultProductionMax = process.env.RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10)
    : 20;

  const max =
    options?.max !== undefined
      ? options.max
      : isRunningTests
      ? 2000
      : defaultProductionMax;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Returns standard RateLimit-* headers
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests from this client. Please try again later.',
        data: null,
      });
    },
  });
};

export const apiRateLimiter = createRateLimiter();
