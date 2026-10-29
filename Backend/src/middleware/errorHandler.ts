import { Request, Response, NextFunction } from 'express';

export interface ApiErrorResponse {
  success: false;
  message: string;
  data: null;
  stack?: string;
}

interface HttpErrorLike {
  status?: number;
  statusCode?: number;
  message?: string;
  stack?: string;
  body?: unknown;
}

/**
 * 404 Handler for unmatched routes
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
 * Centralized Error Handler
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const errorObj = (typeof err === 'object' && err !== null ? err : {}) as HttpErrorLike;
  const status = typeof errorObj.statusCode === 'number'
    ? errorObj.statusCode
    : typeof errorObj.status === 'number'
    ? errorObj.status
    : undefined;

  // Handle JSON parsing errors from express.json()
  if (err instanceof SyntaxError && status === 400 && 'body' in errorObj) {
    res.status(400).json({
      success: false,
      message: 'Malformed JSON payload. Please provide a valid JSON body.',
      data: null,
    });
    return;
  }

  const statusCode = status ?? 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // In production, do not expose internal details or stack traces for server errors
  const message =
    statusCode >= 500 && isProduction
      ? 'Internal server error'
      : errorObj.message || 'An unexpected error occurred';

  const response: ApiErrorResponse = {
    success: false,
    message,
    data: null,
  };

  // Only include stack trace if not in production
  if (!isProduction && errorObj.stack) {
    response.stack = errorObj.stack;
  }

  res.status(statusCode).json(response);
};
