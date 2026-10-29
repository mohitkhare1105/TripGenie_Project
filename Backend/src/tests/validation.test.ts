import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { aiService } from '../services/aiService';
import {
  itineraryRequestSchema,
  ITINERARY_LIMITS,
} from '../schemas/itineraryRequest';

describe('Part 2: Itinerary Request Validation & Management', () => {
  const validMinimalRequest = {
    destination: 'Manali',
    durationDays: 3,
    budget: 10000,
    travellers: 2,
    travelStyle: 'adventure',
  };

  const validFullRequest = {
    destination: 'Goa',
    durationDays: 5,
    budget: 25000,
    travellers: 4,
    travelStyle: 'relaxation',
    startingCity: 'Mumbai',
    interests: ['beaches', 'seafood', 'sunset photography'],
    accommodationPreference: 'standard',
    transportPreference: 'rental vehicle',
    dietaryPreferences: ['vegetarian'],
    accessibilityRequirements: 'Ground-floor rooms preferred',
    additionalNotes: 'Need leisure afternoons',
  };

  const mockItineraryResponse = {
    trip: { destination: 'Manali', durationDays: 3, currency: 'INR' },
    days: [
      {
        day: 1,
        activities: [
          {
            period: 'morning',
            title: 'Hadimba Temple',
            description: 'Visit temple',
            category: 'culture',
            durationMinutes: 90,
            estimatedCost: 100,
            costStatus: 'ai_estimate',
          },
        ],
      },
      {
        day: 2,
        activities: [
          {
            period: 'morning',
            title: 'Solang Valley',
            description: 'Scenic views',
            category: 'adventure',
            durationMinutes: 120,
            estimatedCost: 500,
            costStatus: 'ai_estimate',
          },
        ],
      },
      {
        day: 3,
        activities: [
          {
            period: 'morning',
            title: 'Riverside Walk',
            description: 'Relaxation',
            category: 'relaxation',
            durationMinutes: 60,
            estimatedCost: null,
            costStatus: 'free',
          },
        ],
      },
    ],
    notes: ['AI-generated suggestions have not been verified.'],
  };

  beforeEach(() => {
    aiService.setCustomGenerator(async () => ({
      text: JSON.stringify(mockItineraryResponse),
    }));
  });

  afterEach(() => {
    aiService.setCustomGenerator(undefined);
  });

  // Test 1: Valid travel requests
  describe('1. Valid Travel Requests', () => {
    it('should successfully validate and accept a minimal valid travel request', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send(validMinimalRequest);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(
        res.body.message,
        'Itinerary generated successfully'
      );
      assert.ok(res.body.data);
    });

    it('should successfully validate and accept a comprehensive valid travel request', async () => {
      aiService.setCustomGenerator(async () => ({
        text: JSON.stringify({
          ...mockItineraryResponse,
          trip: { destination: 'Goa', durationDays: 5, currency: 'INR' },
          days: Array.from({ length: 5 }, (_, i) => ({
            day: i + 1,
            activities: [
              {
                period: 'morning',
                title: `Day ${i + 1} Activity`,
                description: 'Beach walk',
                category: 'relaxation',
                durationMinutes: 60,
                estimatedCost: 200,
                costStatus: 'ai_estimate',
              },
            ],
          })),
        }),
      }));

      const res = await request(app)
        .post('/api/itineraries/generate')
        .send(validFullRequest);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(
        res.body.message,
        'Itinerary generated successfully'
      );
    });

    it('should trim whitespace from text inputs when parsing', () => {
      const parsed = itineraryRequestSchema.parse({
        ...validMinimalRequest,
        destination: '   Jaipur   ',
        startingCity: '   Delhi   ',
      });

      assert.strictEqual(parsed.destination, 'Jaipur');
      assert.strictEqual(parsed.startingCity, 'Delhi');
    });
  });

  // Test 2: Missing required fields
  describe('2. Missing Required Fields', () => {
    it('should reject a request with missing required fields with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({});

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Validation failed');
      assert.strictEqual(res.body.data, null);

      const fields = res.body.errors.map((e: { field: string }) => e.field);
      assert.ok(fields.includes('destination'));
      assert.ok(fields.includes('durationDays'));
      assert.ok(fields.includes('budget'));
      assert.ok(fields.includes('travellers'));
      assert.ok(fields.includes('travelStyle'));
    });
  });

  // Test 3: Invalid destination
  describe('3. Invalid Destination', () => {
    it('should reject empty destination string', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, destination: '   ' });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'destination');
      assert.ok(error);
      assert.strictEqual(error.message, 'Destination cannot be empty');
    });

    it('should reject non-string destination', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, destination: 12345 });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'destination');
      assert.ok(error);
      assert.strictEqual(error.message, 'Destination must be a string');
    });

    it('should reject destination exceeding maximum character limit', async () => {
      const longDestination = 'A'.repeat(ITINERARY_LIMITS.DESTINATION_MAX_LENGTH + 1);
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, destination: longDestination });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'destination');
      assert.ok(error);
      assert.ok(error.message.includes('cannot exceed'));
    });
  });

  // Test 4: Invalid duration
  describe('4. Invalid Duration', () => {
    it('should reject negative duration', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, durationDays: -3 });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'durationDays');
      assert.ok(error);
    });

    it('should reject zero duration', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, durationDays: 0 });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'durationDays');
      assert.ok(error);
    });

    it('should reject fractional duration', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, durationDays: 3.5 });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'durationDays');
      assert.ok(error);
      assert.strictEqual(error.message, 'Duration must be a positive integer');
    });

    it('should reject duration exceeding configured maximum limit', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, durationDays: ITINERARY_LIMITS.MAX_DURATION_DAYS + 1 });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'durationDays');
      assert.ok(error);
      assert.ok(error.message.includes('cannot exceed'));
    });
  });

  // Test 5: Invalid budget
  describe('5. Invalid Budget', () => {
    it('should reject negative budget', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, budget: -500 });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'budget');
      assert.ok(error);
    });

    it('should reject zero budget', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, budget: 0 });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'budget');
      assert.ok(error);
    });

    it('should reject non-number budget string', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, budget: 'ten thousand' });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'budget');
      assert.ok(error);
      assert.strictEqual(error.message, 'Budget must be a number');
    });

    it('should reject budget exceeding max budget limit', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, budget: ITINERARY_LIMITS.MAX_BUDGET + 1 });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'budget');
      assert.ok(error);
    });
  });

  // Test 6: Invalid traveller count
  describe('6. Invalid Traveller Count', () => {
    it('should reject zero travellers', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, travellers: 0 });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'travellers');
      assert.ok(error);
    });

    it('should reject negative travellers', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, travellers: -2 });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'travellers');
      assert.ok(error);
    });

    it('should reject fractional travellers', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, travellers: 2.5 });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'travellers');
      assert.ok(error);
      assert.strictEqual(error.message, 'Number of travellers must be a positive integer');
    });

    it('should reject travellers count exceeding limit', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, travellers: ITINERARY_LIMITS.MAX_TRAVELLERS + 1 });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'travellers');
      assert.ok(error);
      assert.ok(error.message.includes('cannot exceed'));
    });
  });

  // Test 7: Unsupported travel style
  describe('7. Unsupported Travel Style', () => {
    it('should reject invalid travelStyle value', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, travelStyle: 'intergalactic' });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'travelStyle');
      assert.ok(error);
      assert.ok(error.message.includes('Travel style must be one of'));
    });
  });

  // Test 8: Invalid optional fields
  describe('8. Invalid Optional Fields', () => {
    it('should reject unsupported accommodationPreference', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, accommodationPreference: 'castle' });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find(
        (e: { field: string }) => e.field === 'accommodationPreference'
      );
      assert.ok(error);
      assert.ok(error.message.includes('Accommodation preference must be one of'));
    });

    it('should reject unsupported transportPreference', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, transportPreference: 'submarine' });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find(
        (e: { field: string }) => e.field === 'transportPreference'
      );
      assert.ok(error);
      assert.ok(error.message.includes('Transport preference must be one of'));
    });

    it('should reject non-array interests', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, interests: 'nature and hiking' });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'interests');
      assert.ok(error);
      assert.strictEqual(error.message, 'Interests must be an array of strings');
    });

    it('should reject too many interests', async () => {
      const excessInterests = Array.from(
        { length: ITINERARY_LIMITS.INTERESTS_MAX_ITEMS + 1 },
        (_, i) => `interest-${i}`
      );
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ ...validMinimalRequest, interests: excessInterests });

      assert.strictEqual(res.status, 400);
      const error = res.body.errors.find((e: { field: string }) => e.field === 'interests');
      assert.ok(error);
      assert.ok(error.message.includes('Cannot provide more than'));
    });
  });

  // Test 9: Unexpected properties (Strict validation)
  describe('9. Unexpected Properties', () => {
    it('should reject unexpected additional properties with field identifier', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({
          ...validMinimalRequest,
          unexpectedField: 'malicious or misspelled input',
          adminSecret: true,
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      const fields = res.body.errors.map((e: { field: string }) => e.field);
      assert.ok(fields.includes('unexpectedField'));
      assert.ok(fields.includes('adminSecret'));
    });

    it('should reject misspelled properties (e.g. duration_days instead of durationDays)', async () => {
      const { durationDays, ...rest } = validMinimalRequest;
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({
          ...rest,
          duration_days: durationDays,
        });

      assert.strictEqual(res.status, 400);
      const fields = res.body.errors.map((e: { field: string }) => e.field);
      assert.ok(fields.includes('duration_days'));
      assert.ok(fields.includes('durationDays'));
    });
  });

  // Test 10: Multiple validation errors
  describe('10. Multiple Validation Errors', () => {
    it('should return multiple validation errors in a single response', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({
          destination: '',
          durationDays: -5,
          budget: 0,
          travellers: 0,
          travelStyle: 'invalid_style',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Validation failed');
      assert.ok(Array.isArray(res.body.errors));
      assert.ok(res.body.errors.length >= 5);

      const fields = res.body.errors.map((e: { field: string }) => e.field);
      assert.ok(fields.includes('destination'));
      assert.ok(fields.includes('durationDays'));
      assert.ok(fields.includes('budget'));
      assert.ok(fields.includes('travellers'));
      assert.ok(fields.includes('travelStyle'));
    });
  });

  // Test 11: Malformed JSON
  describe('11. Malformed JSON', () => {
    it('should return 400 when request body contains malformed JSON syntax', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .set('Content-Type', 'application/json')
        .send('{ "destination": "Manali", brokenJson: true ');

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(
        res.body.message,
        'Malformed JSON payload. Please provide a valid JSON body.'
      );
      assert.strictEqual(res.body.data, null);
    });
  });

  // Test 12: Confirmation that invalid requests never reach the controller
  describe('12. Controller Protection', () => {
    it('should never invoke controller or return 200 on an invalid request', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({ destination: 'Valid Destination Only' });

      // Validation failure must return 400 and NOT the controller's success message
      assert.strictEqual(res.status, 400);
      assert.notStrictEqual(
        res.body.message,
        'Itinerary generated successfully'
      );
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.data, null);
    });
  });

  // Preservation: Health check intact
  describe('Preservation of Health Check', () => {
    it('GET /api/health should remain intact and return 200', async () => {
      const res = await request(app).get('/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, 'TripGenie AI backend is running');
    });
  });
});

