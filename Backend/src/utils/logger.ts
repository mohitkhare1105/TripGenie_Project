import { Request, Response, NextFunction } from 'express';

// Extend Express Request interface to include id
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Sanitizes strings to redact sensitive patterns such as API keys, authorization tokens, or secrets.
 */
export const sanitizeForLogging = (input: unknown): unknown => {
  if (typeof input === 'string') {
    return input
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
      .replace(/AQ\.[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]')
      .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED_TOKEN]')
      .replace(/("?(?:apiKey|password|secret|key)"?\s*[:=]\s*"?[^",\s]+"?)/gi, '$1=[REDACTED]');
  }

  if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      return input.map(sanitizeForLogging);
    }
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) {
      if (/password|secret|apikey|key|token|auth/i.test(k)) {
        sanitizedObj[k] = '[REDACTED]';
      } else {
        sanitizedObj[k] = sanitizeForLogging(v);
      }
    }
    return sanitizedObj;
  }

  return input;
};

export const logger = {
  info: (message: string, meta?: Record<string, unknown>): void => {
    const timestamp = new Date().toISOString();
    const sanitizedMeta = meta ? JSON.stringify(sanitizeForLogging(meta)) : '';
    console.log(`[INFO] [${timestamp}] ${message} ${sanitizedMeta}`.trim());
  },
  warn: (message: string, meta?: Record<string, unknown>): void => {
    const timestamp = new Date().toISOString();
    const sanitizedMeta = meta ? JSON.stringify(sanitizeForLogging(meta)) : '';
    console.warn(`[WARN] [${timestamp}] ${message} ${sanitizedMeta}`.trim());
  },
  error: (message: string, meta?: Record<string, unknown>): void => {
    const timestamp = new Date().toISOString();
    const sanitizedMeta = meta ? JSON.stringify(sanitizeForLogging(meta)) : '';
    console.error(`[ERROR] [${timestamp}] ${message} ${sanitizedMeta}`.trim());
  },
};

/**
 * Middleware that assigns or forwards an X-Request-ID to trace requests across services.
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const incomingId = req.headers['x-request-id'];
  const requestId =
    typeof incomingId === 'string' && incomingId.trim().length > 0
      ? incomingId.trim()
      : `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

