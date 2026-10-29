import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiErrorResponse {
  success: false;
  message: string;
  data: null;
  errors?: unknown[];
  stack?: string;
}

interface HttpErrorLike {
  status?: number;
  statusCode?: number;
  type?: string;
  message?: string;
  stack?: string;
  body?: unknown;
  errors?: unknown[];
}

/**
 * 404 Handler for unmatched routes.
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    data: null,
  });
};

/**
 * Centralized Error Handler.
 * Safely maps internal exceptions to standardized HTTP responses without leaking credentials or stack traces.
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const errorObj = (typeof err === 'object' && err !== null ? err : {}) as HttpErrorLike;
  const status =
    typeof errorObj.statusCode === 'number'
      ? errorObj.statusCode
      : typeof errorObj.status === 'number'
      ? errorObj.status
      : undefined;

  // 1. Handle oversized payload (HTTP 413)
  if (
    errorObj.type === 'entity.too.large' ||
    status === 413 ||
    (err instanceof Error && err.message.toLowerCase().includes('entity too large'))
  ) {
    logger.warn('Request body exceeds size limit', {
      requestId: req.id,
      path: req.originalUrl,
    });

    res.status(413).json({
      success: false,
      message: 'Request payload exceeds the maximum allowed limit',
      data: null,
    });
    return;
  }

  // 2. Handle CORS policy violation (HTTP 403)
  if (err instanceof Error && err.message.includes('CORS policy violation')) {
    logger.warn('Blocked by CORS policy', {
      requestId: req.id,
      origin: req.headers.origin,
      path: req.originalUrl,
    });

    res.status(403).json({
      success: false,
      message: err.message,
      data: null,
    });
    return;
  }

  // 2. Handle JSON parsing errors from express.json() (HTTP 400)
  if (
    (err instanceof SyntaxError && status === 400 && 'body' in errorObj) ||
    errorObj.type === 'entity.parse.failed'
  ) {
    res.status(400).json({
      success: false,
      message: 'Malformed JSON payload. Please provide a valid JSON body.',
      data: null,
    });
    return;
  }

  const statusCode = status ?? 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // In production, mask unexpected 500 error details
  const message =
    statusCode >= 500 && isProduction
      ? 'Internal server error'
      : errorObj.message || 'An unexpected error occurred';

  // Log diagnostic error details safely (redacts any secrets)
  logger.error('Request processing error', {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: errorObj.message || 'Unknown error',
  });

  const response: ApiErrorResponse = {
    success: false,
    message,
    data: null,
  };

  if (Array.isArray(errorObj.errors)) {
    response.errors = errorObj.errors;
  }

  // Strictly omit stack traces in production
  if (!isProduction && errorObj.stack) {
    response.stack = errorObj.stack;
  }

  res.status(statusCode).json(response);
};
