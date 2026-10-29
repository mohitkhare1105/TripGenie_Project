import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

// In-flight request set with safety TTL timestamps
const inFlightRequests = new Map<string, NodeJS.Timeout>();

/**
 * Creates an in-flight duplicate request prevention middleware.
 *
 * SCOPE & LIMITATIONS:
 * - Detects and debounces identical requests currently being processed in-flight from the same client.
 * - Once the original request finishes or is closed, the lock is automatically freed.
 * - Includes a 35-second safety timeout to avoid deadlocks in case of unexpected socket drops.
 * - In-memory only; does not provide distributed cross-server deduplication.
 */
export const preventConcurrentDuplicates = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Only apply to POST/PUT mutation requests
  if (req.method !== 'POST' && req.method !== 'PUT') {
    next();
    return;
  }

  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const bodyHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(req.body || {}))
    .digest('hex');

  const lockKey = `${clientIp}:${req.path}:${bodyHash}`;

  if (inFlightRequests.has(lockKey)) {
    res.status(429).json({
      success: false,
      message:
        'An identical request is currently being processed. Please wait for it to finish.',
      data: null,
    });
    return;
  }

  // Safety timer to clear lock if client disconnects without finish
  const safetyTimer = setTimeout(() => {
    inFlightRequests.delete(lockKey);
  }, 35000);

  if (typeof safetyTimer.unref === 'function') safetyTimer.unref();
  inFlightRequests.set(lockKey, safetyTimer);

  const cleanup = () => {
    const timer = inFlightRequests.get(lockKey);
    if (timer) clearTimeout(timer);
    inFlightRequests.delete(lockKey);
  };

  res.on('finish', cleanup);
  res.on('close', cleanup);

  next();
};

/**
 * Helper to clear all active in-flight locks (useful for test resets).
 */
export const clearInFlightLocks = (): void => {
  for (const timer of inFlightRequests.values()) {
    clearTimeout(timer);
  }
  inFlightRequests.clear();
};

