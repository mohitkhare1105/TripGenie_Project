import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { aiService, AiService, AiServiceError } from '../services/aiService';
import { createRateLimiter } from '../middleware/rateLimiter';
import {
  preventConcurrentDuplicates,
  clearInFlightLocks,
} from '../middleware/duplicateRequestPrevention';
import { sanitizeForLogging } from '../utils/logger';
import express, { Request, Response } from 'express';

describe('Part 5: Security, Error Handling, and Backend Reliability', () => {
  const validRequest = {
    destination: 'Varanasi',
    durationDays: 2,
    budget: 12000,
    travellers: 2,
    travelStyle: 'culture',
  };

  const sampleMockResponse = {
    trip: { destination: 'Varanasi', durationDays: 2, currency: 'INR' },
    days: [
      {
        day: 1,
        activities: [
          {
            period: 'morning',
            title: 'Ghat Walk',
            description: 'Morning walk',
            category: 'culture',
            durationMinutes: 60,
            estimatedCost: 100,
            costStatus: 'ai_estimate',
          },
        ],
      },
      {
        day: 2,
        activities: [
          {
            period: 'evening',
            title: 'Ganga Aarti',
            description: 'Evening prayer',
            category: 'culture',
            durationMinutes: 90,
            estimatedCost: 200,
            costStatus: 'ai_estimate',
          },
        ],
      },
    ],
    notes: ['Suggestions only.'],
  };

  beforeEach(() => {
    clearInFlightLocks();
    aiService.setCustomGenerator(async () => ({
      text: JSON.stringify(sampleMockResponse),
    }));
  });

  afterEach(() => {
    clearInFlightLocks();
    aiService.setCustomGenerator(undefined);
  });

  // 1. HTTP Security Headers
  describe('1. HTTP Security Headers', () => {
    it('should set security headers via Helmet and hide x-powered-by', async () => {
      const res = await request(app).get('/api/health');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['x-powered-by'], undefined);
      assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
      assert.ok(res.headers['x-request-id']);
    });
  });

  // 2. CORS Security
  describe('2. CORS Origin Protection', () => {
    it('should permit allowed origin configured in CLIENT_ORIGIN', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(
        res.headers['access-control-allow-origin'],
        'http://localhost:5173'
      );
    });

    it('should reject untrusted origins with 403 in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const res = await request(app)
          .get('/api/health')
          .set('Origin', 'https://malicious-phishing-site.com');

        assert.strictEqual(res.status, 403);
        assert.strictEqual(res.body.success, false);
        assert.ok(res.body.message.includes('CORS policy violation'));
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  // 3. Request-Size Limit (HTTP 413)
  describe('3. Request Body Size Protection', () => {
    it('should reject requests exceeding the 100kb payload limit with HTTP 413', async () => {
      // Create a payload larger than 100kb (~120kb)
      const oversizedPayload = {
        destination: 'Manali',
        durationDays: 3,
        budget: 10000,
        travellers: 2,
        travelStyle: 'adventure',
        additionalNotes: 'X'.repeat(120 * 1024),
      };

      const res = await request(app)
        .post('/api/itineraries/generate')
        .send(oversizedPayload);

      assert.strictEqual(res.status, 413);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(
        res.body.message,
        'Request payload exceeds the maximum allowed limit'
      );
      assert.strictEqual(res.body.data, null);
    });
  });

  // 4. Rate Limiting Protection (HTTP 429)
  describe('4. Rate Limiter Abuse Prevention', () => {
    it('should return HTTP 429 when rate limit is exceeded', async () => {
      // Test isolated limiter configured with max 2 requests
      const testLimiter = createRateLimiter({ max: 2, windowMs: 60000 });
      const testApp = express();
      testApp.use(testLimiter);
      testApp.get('/test', (_req: Request, res: Response) => {
        res.json({ ok: true });
      });

      // Request 1: OK
      const res1 = await request(testApp).get('/test');
      assert.strictEqual(res1.status, 200);

      // Request 2: OK
      const res2 = await request(testApp).get('/test');
      assert.strictEqual(res2.status, 200);

      // Request 3: Rate Limited (429)
      const res3 = await request(testApp).get('/test');
      assert.strictEqual(res3.status, 429);
      assert.strictEqual(res3.body.success, false);
      assert.strictEqual(
        res3.body.message,
        'Too many requests from this client. Please try again later.'
      );
    });
  });

  // 5. Duplicate In-Flight Request Protection
  describe('5. Duplicate In-Flight Debouncing', () => {
    it('should debounce identical concurrent in-flight requests with 429', () => {
      let firstNextCalled = false;
      const req1 = {
        method: 'POST',
        path: '/api/itineraries/generate',
        ip: '127.0.0.1',
        body: { destination: 'Manali', budget: 10000 },
      } as unknown as Request;

      let finishCallback: () => void = () => { };
      const res1 = {
        on: (event: string, cb: () => void) => {
          if (event === 'finish') finishCallback = cb;
        },
      } as unknown as Response;

      // 1. First request acquires lock and proceeds
      preventConcurrentDuplicates(req1, res1, () => {
        firstNextCalled = true;
      });
      assert.strictEqual(firstNextCalled, true);

      // 2. Second identical request while first is in-flight is rejected with 429
      let statusCode = 0;
      let responseBody: any = null;
      const res2 = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              responseBody = data;
            },
          };
        },
      } as unknown as Response;

      let secondNextCalled = false;
      preventConcurrentDuplicates(req1, res2, () => {
        secondNextCalled = true;
      });

      assert.strictEqual(secondNextCalled, false);
      assert.strictEqual(statusCode, 429);
      assert.strictEqual(responseBody?.success, false);
      assert.ok(
        responseBody?.message?.includes('currently being processed')
      );

      // 3. First request finishes and releases lock
      finishCallback();

      // 4. Subsequent request now succeeds
      let thirdNextCalled = false;
      preventConcurrentDuplicates(req1, res1, () => {
        thirdNextCalled = true;
      });
      assert.strictEqual(thirdNextCalled, true);
    });
  });

  // 6. Safe Logging & Secret Redaction
  describe('6. Safe Logging & Redaction', () => {
    it('should redact sensitive keys and tokens from logs', () => {
      const sensitiveInput = {
        apiKey: 'test-key-not-a-real-credential',
        authorization: 'Bearer secret_token_xyz_123',
        password: 'mypassword',
        userNotes: 'Travel with family',
      };

      const sanitized = sanitizeForLogging(sensitiveInput) as Record<
        string,
        unknown
      >;

      assert.strictEqual(sanitized['apiKey'], '[REDACTED]');
      assert.strictEqual(sanitized['authorization'], '[REDACTED]');
      assert.strictEqual(sanitized['password'], '[REDACTED]');
      assert.strictEqual(sanitized['userNotes'], 'Travel with family');
    });

    it('should never expose API keys in responses or error payloads', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send(validRequest);

      const responseString = JSON.stringify(res.body);
      assert.strictEqual(responseString.includes(process.env.GEMINI_API_KEY || 'AQ.'), false);
    });
  });

  // 7. Production Error Shielding
  describe('7. Production Error Shielding', () => {
    it('should never expose internal stack traces when NODE_ENV is production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const errorApp = express();
      errorApp.get('/crash', () => {
        throw new Error('Database connection secret failed');
      });
      // Attach central errorHandler
      const { errorHandler } = await import('../middleware/errorHandler');
      errorApp.use(errorHandler);

      try {
        const res = await request(errorApp).get('/crash');
        assert.strictEqual(res.status, 500);
        assert.strictEqual(res.body.success, false);
        assert.strictEqual(res.body.message, 'Internal server error');
        assert.strictEqual(res.body.stack, undefined);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  // 8. Gemini Reliability: Transient Error Bounded Retry
  describe('8. Gemini Transient Error Bounded Retry', () => {
    it('should retry once on transient network failure and succeed on second attempt', async () => {
      let callCount = 0;
      const service = new AiService({
        customGenerator: async () => {
          callCount++;
          if (callCount === 1) {
            // First attempt fails with transient timeout
            const transientErr = new Error('connect ETIMEDOUT');
            (transientErr as { status?: number }).status = 503;
            throw transientErr;
          }
          // Second attempt succeeds
          return { text: JSON.stringify(sampleMockResponse) };
        },
      });

      const itinerary = await service.generateItinerary({
        destination: 'Varanasi',
        durationDays: 2,
        budget: 10000,
        travellers: 2,
        travelStyle: 'culture',
      });

      assert.strictEqual(callCount, 2); // Proves retry occurred
      assert.strictEqual(itinerary.trip.destination, 'Varanasi');
    });

    it('should NOT retry non-transient errors like 400 or 401', async () => {
      let callCount = 0;
      const service = new AiService({
        customGenerator: async () => {
          callCount++;
          const nonTransientErr = new Error('Invalid model identifier or auth error');
          (nonTransientErr as { status?: number }).status = 404;
          throw nonTransientErr;
        },
      });

      await assert.rejects(
        async () =>
          service.generateItinerary({
            destination: 'Varanasi',
            durationDays: 2,
            budget: 10000,
            travellers: 2,
            travelStyle: 'culture',
          }),
        (err: unknown) => {
          assert.ok(err instanceof AiServiceError);
          assert.strictEqual(err.statusCode, 503);
          return true;
        }
      );

      // Must have failed immediately on attempt 1 without wasteful retries
      assert.strictEqual(callCount, 1);
    });
  });
});
