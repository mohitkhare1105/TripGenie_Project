import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { aiService, AiService, AiServiceError } from '../services/aiService';
import { buildItineraryPrompt } from '../utils/promptBuilder';
import { itineraryResponseSchema } from '../schemas/itineraryResponse';
import { ItineraryRequest } from '../schemas/itineraryRequest';

describe('Part 3: Gemini AI Integration & Itinerary Generation', () => {
  const sampleRequest: ItineraryRequest = {
    destination: 'Manali',
    durationDays: 3,
    budget: 15000,
    travellers: 2,
    travelStyle: 'adventure',
    startingCity: 'Chandigarh',
    interests: ['nature', 'trekking', 'local food'],
    accommodationPreference: 'budget',
    transportPreference: 'public transport',
    dietaryPreferences: ['vegetarian'],
    accessibilityRequirements: 'None',
    additionalNotes: 'Prefer early mornings',
  };

  const sampleValidResponse = {
    trip: {
      destination: 'Manali',
      durationDays: 3,
      currency: 'INR',
    },
    days: [
      {
        day: 1,
        theme: 'Old Manali & Culture',
        activities: [
          {
            period: 'morning',
            title: 'Hadimba Temple Visit',
            description: 'Ancient wooden temple in cedar forest.',
            category: 'culture',
            durationMinutes: 90,
            estimatedCost: 100,
            costStatus: 'ai_estimate',
          },
          {
            period: 'afternoon',
            title: 'Local Himachali Lunch',
            description: 'Try local Siddu and mountain tea.',
            category: 'food',
            durationMinutes: 90,
            estimatedCost: 400,
            costStatus: 'ai_estimate',
          },
        ],
      },
      {
        day: 2,
        theme: 'Solang Valley Adventure',
        activities: [
          {
            period: 'morning',
            title: 'Valley Walk & Scenic Views',
            description: 'Easy mountain trail with views of the valley.',
            category: 'adventure',
            durationMinutes: 180,
            estimatedCost: 500,
            costStatus: 'ai_estimate',
          },
        ],
      },
      {
        day: 3,
        theme: 'Riverside Relaxation',
        activities: [
          {
            period: 'morning',
            title: 'Beas River Walk',
            description: 'Gentle walk along the river banks before departure.',
            category: 'relaxation',
            durationMinutes: 120,
            estimatedCost: null,
            costStatus: 'free',
          },
        ],
      },
    ],
    notes: [
      'AI-generated suggestions and estimated prices have not been independently verified.',
    ],
  };

  afterEach(() => {
    aiService.setCustomGenerator(undefined);
  });

  // 1. Prompt Construction
  describe('1. Prompt Construction', () => {
    it('should build prompt including all supplied travel preferences', () => {
      const prompt = buildItineraryPrompt(sampleRequest);

      assert.ok(prompt.systemInstruction.includes('TripGenie AI'));
      assert.ok(prompt.systemInstruction.includes('EXACTLY 3 day entries'));
      assert.ok(prompt.userPrompt.includes('Destination: Manali'));
      assert.ok(prompt.userPrompt.includes('Duration: 3 days'));
      assert.ok(prompt.userPrompt.includes('Total Group Budget: INR 15000'));
      assert.ok(prompt.userPrompt.includes('Number of Travellers: 2'));
      assert.ok(prompt.userPrompt.includes('Travel Style: adventure'));
      assert.ok(prompt.userPrompt.includes('Starting City: Chandigarh'));
      assert.ok(prompt.userPrompt.includes('Key Interests: nature, trekking, local food'));
      assert.ok(prompt.userPrompt.includes('Accommodation Preference: budget'));
      assert.ok(prompt.userPrompt.includes('Transport Preference: public transport'));
      assert.ok(prompt.userPrompt.includes('Dietary Preferences: vegetarian'));
      assert.ok(prompt.userPrompt.includes('Additional User Notes'));
    });

    it('should build valid prompt when optional preferences are omitted', () => {
      const minimalReq: ItineraryRequest = {
        destination: 'Jaipur',
        durationDays: 2,
        budget: 8000,
        travellers: 1,
        travelStyle: 'solo',
      };
      const prompt = buildItineraryPrompt(minimalReq);

      assert.ok(prompt.userPrompt.includes('Destination: Jaipur'));
      assert.ok(prompt.userPrompt.includes('Duration: 2 days'));
      assert.ok(!prompt.userPrompt.includes('Starting City:'));
      assert.ok(!prompt.userPrompt.includes('Key Interests:'));
    });
  });

  // 2. Successful parsing of valid model JSON
  describe('2. Parsing Valid Model JSON', () => {
    it('should parse and validate structured model JSON successfully', () => {
      const parsed = itineraryResponseSchema.parse(sampleValidResponse);
      assert.strictEqual(parsed.trip.destination, 'Manali');
      assert.strictEqual(parsed.days.length, 3);
      assert.strictEqual(parsed.days[0].activities[0].title, 'Hadimba Temple Visit');
    });

    it('should support null estimatedCost for free activities', () => {
      const parsed = itineraryResponseSchema.parse(sampleValidResponse);
      assert.strictEqual(parsed.days[2].activities[0].estimatedCost, null);
      assert.strictEqual(parsed.days[2].activities[0].costStatus, 'free');
    });
  });

  // 3. Rejection of malformed JSON
  describe('3. Rejection of Malformed JSON', () => {
    it('should reject malformed JSON with 502 error after failed repair attempt', async () => {
      const service = new AiService({
        customGenerator: async () => ({ text: 'This is not JSON: { broken' }),
      });

      await assert.rejects(
        async () => service.generateItinerary(sampleRequest),
        (err: unknown) => {
          assert.ok(err instanceof AiServiceError);
          assert.strictEqual(err.statusCode, 502);
          return true;
        }
      );
    });
  });

  // 4. Rejection of incorrect number of days
  describe('4. Rejection of Incorrect Number of Days', () => {
    it('should reject an itinerary with fewer days than requested', () => {
      const invalidDaysResponse = {
        ...sampleValidResponse,
        trip: { ...sampleValidResponse.trip, durationDays: 3 },
        days: [sampleValidResponse.days[0]], // only 1 day instead of 3
      };

      const result = itineraryResponseSchema.safeParse(invalidDaysResponse);
      assert.strictEqual(result.success, false);
    });

    it('should reject non-sequential day numbering (e.g. day 1 then day 3)', () => {
      const nonSequentialResponse = {
        ...sampleValidResponse,
        days: [
          sampleValidResponse.days[0],
          { ...sampleValidResponse.days[1], day: 3 },
          { ...sampleValidResponse.days[2], day: 2 },
        ],
      };

      const result = itineraryResponseSchema.safeParse(nonSequentialResponse);
      assert.strictEqual(result.success, false);
    });
  });

  // 5. Rejection of invalid activity periods
  describe('5. Rejection of Invalid Activity Periods', () => {
    it('should reject invalid period values', () => {
      const invalidPeriod = {
        ...sampleValidResponse,
        days: [
          {
            ...sampleValidResponse.days[0],
            activities: [
              {
                ...sampleValidResponse.days[0].activities[0],
                period: 'midnight_rave',
              },
            ],
          },
          sampleValidResponse.days[1],
          sampleValidResponse.days[2],
        ],
      };

      const result = itineraryResponseSchema.safeParse(invalidPeriod);
      assert.strictEqual(result.success, false);
    });
  });

  // 6. Rejection of negative or non-finite costs
  describe('6. Rejection of Negative or Non-Finite Costs', () => {
    it('should reject negative estimated cost', () => {
      const negativeCost = {
        ...sampleValidResponse,
        days: [
          {
            ...sampleValidResponse.days[0],
            activities: [
              {
                ...sampleValidResponse.days[0].activities[0],
                estimatedCost: -250,
              },
            ],
          },
          sampleValidResponse.days[1],
          sampleValidResponse.days[2],
        ],
      };

      const result = itineraryResponseSchema.safeParse(negativeCost);
      assert.strictEqual(result.success, false);
    });
  });

  // 7. Handling of empty model response
  describe('7. Empty Model Response', () => {
    it('should throw 502 when model returns empty text', async () => {
      const service = new AiService({
        customGenerator: async () => ({ text: '   ' }),
      });

      await assert.rejects(
        async () => service.generateItinerary(sampleRequest),
        (err: unknown) => {
          assert.ok(err instanceof AiServiceError);
          assert.strictEqual(err.statusCode, 502);
          return true;
        }
      );
    });
  });

  // 8. Missing API Key
  describe('8. Missing API Key Handling', () => {
    it('should fail with 503 when GEMINI_API_KEY is not set', async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      try {
        const service = new AiService(); // no custom generator, will invoke getClient()
        await assert.rejects(
          async () => service.generateItinerary(sampleRequest),
          (err: unknown) => {
            assert.ok(err instanceof AiServiceError);
            assert.strictEqual(err.statusCode, 503);
            assert.ok(err.message.includes('not configured'));
            return true;
          }
        );
      } finally {
        process.env.GEMINI_API_KEY = originalKey;
      }
    });
  });

  // 9. Provider Timeout and Rate Limit Errors
  describe('9. Provider Timeout & Rate Limits', () => {
    it('should map timeout errors to HTTP 504', async () => {
      const service = new AiService({
        timeoutMs: 50,
        customGenerator: async () => {
          await new Promise((resolve) => setTimeout(resolve, 150));
          return { text: JSON.stringify(sampleValidResponse) };
        },
      });

      await assert.rejects(
        async () => service.generateItinerary(sampleRequest),
        (err: unknown) => {
          assert.ok(err instanceof AiServiceError);
          assert.strictEqual(err.statusCode, 504);
          assert.ok(err.message.includes('timed out'));
          return true;
        }
      );
    });

    it('should map rate limit errors (429) to HTTP 429', async () => {
      const service = new AiService({
        customGenerator: async () => {
          const rateLimitErr = new Error('ResourceExhausted: 429 quota exceeded');
          (rateLimitErr as { status?: number }).status = 429;
          throw rateLimitErr;
        },
      });

      await assert.rejects(
        async () => service.generateItinerary(sampleRequest),
        (err: unknown) => {
          assert.ok(err instanceof AiServiceError);
          assert.strictEqual(err.statusCode, 429);
          return true;
        }
      );
    });
  });

  // 10. HTTP Endpoint End-to-End Integration with Mock
  describe('10. API Integration & Safe Responses', () => {
    it('should return 200 with generated itinerary on valid request', async () => {
      aiService.setCustomGenerator(async () => ({
        text: JSON.stringify(sampleValidResponse),
      }));

      const res = await request(app)
        .post('/api/itineraries/generate')
        .send(sampleRequest);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, 'Itinerary generated successfully');
      assert.strictEqual(res.body.data.trip.destination, 'Manali');
      assert.strictEqual(res.body.data.days.length, 3);
    });

    it('should return safe error response with proper status code on AI failure', async () => {
      aiService.setCustomGenerator(async () => {
        const timeoutErr = new Error('request timed out');
        timeoutErr.name = 'TimeoutError';
        throw timeoutErr;
      });

      const res = await request(app)
        .post('/api/itineraries/generate')
        .send(sampleRequest);

      assert.strictEqual(res.status, 504);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.data, null);
      assert.ok(res.body.message.includes('timed out'));
    });
  });

  // 11. Health endpoint still works
  describe('11. Preservation of Health Endpoint', () => {
    it('GET /api/health should remain working and return 200', async () => {
      const res = await request(app).get('/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, 'TripGenie AI backend is running');
    });
  });

  // 12. Invalid requests rejected before AI service is called
  describe('12. Validation Guard Before AI Call', () => {
    it('should reject invalid requests with 400 without invoking AI service', async () => {
      let aiCalled = false;
      aiService.setCustomGenerator(async () => {
        aiCalled = true;
        return { text: JSON.stringify(sampleValidResponse) };
      });

      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ destination: '' }); // missing required fields, invalid destination

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(aiCalled, false); // Confirms AI was NEVER invoked
    });
  });
});

