import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { aiService, AiServiceError } from '../services/aiService';
import { clearInFlightLocks } from '../middleware/duplicateRequestPrevention';

describe('Part 6: Full End-to-End Integration Tests', () => {
  const sampleManaliItinerary = {
    trip: {
      destination: 'Manali',
      durationDays: 3,
      currency: 'INR',
    },
    days: [
      {
        day: 1,
        theme: 'Heritage and Nature Trails',
        activities: [
          {
            period: 'morning',
            title: 'Hadimba Temple and Dhungri Van Vihar',
            description: 'Morning walk through pine and deodar forests.',
            category: 'sightseeing',
            durationMinutes: 90,
            estimatedCost: 100,
            costStatus: 'ai_estimate',
            pricingType: 'per_person', // 100 * 2 = 200
            location: 'Old Manali',
          },
          {
            period: 'afternoon',
            title: 'Himachali Traditional Lunch',
            description: 'Try local Siddu and mountain trout.',
            category: 'food',
            durationMinutes: 75,
            estimatedCost: 400,
            costStatus: 'ai_estimate',
            pricingType: 'per_person', // 400 * 2 = 800
          },
          {
            period: 'evening',
            title: 'Riverside Camp Stay Check-in',
            description: 'Overnight riverside cabin stay.',
            category: 'accommodation',
            durationMinutes: 120,
            estimatedCost: 2500,
            costStatus: 'ai_estimate',
            pricingType: 'group', // shared group lodging = 2500
          },
        ],
      },
      {
        day: 2,
        theme: 'Solang Valley Adventure',
        activities: [
          {
            period: 'morning',
            title: 'Solang Valley Trek & Cable Car',
            description: 'Scenic trail and ropeway ride.',
            category: 'adventure',
            durationMinutes: 180,
            estimatedCost: 800,
            costStatus: 'ai_estimate',
            pricingType: 'per_person', // 800 * 2 = 1600
          },
          {
            period: 'afternoon',
            title: 'Mountain Cafe Snack & Tea',
            description: 'Hot tea and Maggi overlooking the peaks.',
            category: 'food',
            durationMinutes: 60,
            estimatedCost: 200,
            costStatus: 'ai_estimate',
            pricingType: 'per_person', // 200 * 2 = 400
          },
          {
            period: 'evening',
            title: 'Bonfire and Stargazing',
            description: 'Relaxation at camp.',
            category: 'relaxation',
            durationMinutes: 90,
            estimatedCost: null,
            costStatus: 'free',
          },
        ],
      },
      {
        day: 3,
        theme: 'Vashisht Hot Springs & Mall Road',
        activities: [
          {
            period: 'morning',
            title: 'Vashisht Village & Hot Sulphur Springs',
            description: 'Natural therapeutic bath and temple visit.',
            category: 'culture',
            durationMinutes: 90,
            estimatedCost: null,
            costStatus: 'free',
          },
          {
            period: 'afternoon',
            title: 'Mall Road Local Souvenirs',
            description: 'Himachali handloom shawls and honey.',
            category: 'shopping',
            durationMinutes: 120,
            estimatedCost: 1000,
            costStatus: 'ai_estimate',
            pricingType: 'group', // 1000
          },
          {
            period: 'evening',
            title: 'Transit to Bus Terminal',
            description: 'Local cab to boarding point.',
            category: 'travel',
            durationMinutes: 45,
            estimatedCost: 400,
            costStatus: 'ai_estimate',
            pricingType: 'group', // 400
          },
        ],
      },
    ],
    notes: [
      'Carry warm clothing as evenings can get chilly.',
      'AI-generated suggestions have not been verified with live booking systems.',
    ],
  };

  beforeEach(() => {
    clearInFlightLocks();
    aiService.setCustomGenerator(async () => ({
      text: JSON.stringify(sampleManaliItinerary),
    }));
  });

  afterEach(() => {
    clearInFlightLocks();
    aiService.setCustomGenerator(undefined);
  });

  // Test Case 1: Successful Itinerary Generation Workflow
  describe('Test Case 1: Complete Itinerary Generation Journey', () => {
    it('should accept valid travel preferences and return structured 3-day itinerary with verified budget calculations', async () => {
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({
          destination: 'Manali',
          durationDays: 3,
          budget: 10000,
          travellers: 2,
          travelStyle: 'adventure',
          interests: ['nature', 'trekking', 'local food'],
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, 'Itinerary generated successfully');

      const data = res.body.data;
      assert.strictEqual(data.trip.destination, 'Manali');
      assert.strictEqual(data.trip.durationDays, 3);
      assert.strictEqual(data.days.length, 3);
      assert.strictEqual(data.days[0].day, 1);
      assert.strictEqual(data.days[1].day, 2);
      assert.strictEqual(data.days[2].day, 3);

      // Verify server-calculated financial numbers:
      // transport: 400
      // accommodation: 2500
      // food: (400*2) + (200*2) = 1200
      // activities: (100*2) + (800*2) = 1800
      // shopping: 1000
      // miscellaneous: 0
      // Grand Total = 400 + 2500 + 1200 + 1800 + 1000 = 6900
      assert.strictEqual(data.budget.userBudget, 10000);
      assert.strictEqual(data.budget.estimatedTotal, 6900);
      assert.strictEqual(data.budget.difference, 3100);
      assert.strictEqual(data.budget.estimatedPerPerson, 3450); // 6900 / 2
      assert.strictEqual(data.budget.status, 'under_budget');
    });
  });

  // Test Case 2: Validation Guard Rejecting Invalid Input
  describe('Test Case 2: Invalid Input Guarding', () => {
    it('should reject invalid input without calling Gemini AI', async () => {
      let aiCalled = false;
      aiService.setCustomGenerator(async () => {
        aiCalled = true;
        return { text: JSON.stringify(sampleManaliItinerary) };
      });

      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({
          destination: '',
          durationDays: -2,
          budget: -100,
          travellers: 0,
          travelStyle: 'unknown_style',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Validation failed');
      assert.strictEqual(aiCalled, false); // Gemini API was protected from wasteful calls
    });
  });

  // Test Case 3: Over-Budget Calculation and Warning
  describe('Test Case 3: Over-Budget Calculation and Warnings', () => {
    it('should correctly flag over-budget and generate actionable warning', async () => {
      // Estimated total is 6900; user budget is 5000 (exceeds by 1900)
      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({
          destination: 'Manali',
          durationDays: 3,
          budget: 5000,
          travellers: 2,
          travelStyle: 'adventure',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.budget.userBudget, 5000);
      assert.strictEqual(res.body.data.budget.estimatedTotal, 6900);
      assert.strictEqual(res.body.data.budget.difference, -1900);
      assert.strictEqual(res.body.data.budget.status, 'over_budget');
      assert.ok(res.body.data.budget.warning);
      assert.ok(res.body.data.budget.warning.includes('exceeds your budget'));
      assert.ok(res.body.data.budget.warning.includes('1,900'));
    });
  });

  // Test Case 4: Smart Budget Optimization Workflow
  describe('Test Case 4: Smart Budget Optimization Workflow', () => {
    it('should propose lower-cost alternative and recalculate revised budget', async () => {
      const optimizedProposal = {
        trip: { destination: 'Manali', durationDays: 3, currency: 'INR' },
        days: [
          {
            day: 1,
            activities: [
              {
                period: 'morning',
                title: 'Self-guided Old Manali Walking Tour',
                description: 'Scenic walk through cedar trails.',
                category: 'sightseeing',
                durationMinutes: 90,
                estimatedCost: null,
                costStatus: 'free',
              },
              {
                period: 'afternoon',
                title: 'Local Dhaba Lunch',
                description: 'Authentic local meal.',
                category: 'food',
                durationMinutes: 60,
                estimatedCost: 150,
                pricingType: 'per_person', // 150 * 2 = 300
              },
              {
                period: 'evening',
                title: 'Standard Homestay Booking',
                description: 'Cozy shared room at budget homestay.',
                category: 'accommodation',
                durationMinutes: 120,
                estimatedCost: 1200,
                pricingType: 'group', // 1200
              },
            ],
          },
          {
            day: 2,
            activities: [
              {
                period: 'morning',
                title: 'Solang Valley Public Bus and Hike',
                description: 'Take local bus instead of private cab.',
                category: 'adventure',
                durationMinutes: 180,
                estimatedCost: 100,
                pricingType: 'per_person', // 100 * 2 = 200
              },
            ],
          },
          {
            day: 3,
            activities: [
              {
                period: 'morning',
                title: 'Vashisht Free Springs Visit',
                description: 'Relaxation at natural hot springs.',
                category: 'relaxation',
                durationMinutes: 90,
                estimatedCost: null,
                costStatus: 'free',
              },
            ],
          },
        ],
        notes: [
          'Swapped private cab for local transit.',
          'Replaced resort lodging with budget homestay to stay within budget.',
        ],
      };

      aiService.setCustomGenerator(async () => ({
        text: JSON.stringify(optimizedProposal),
      }));

      const res = await request(app)
        .post('/api/itineraries/optimize-budget')
        .send({
          itinerary: sampleManaliItinerary,
          userBudget: 2500,
          travellers: 2,
          travelStyle: 'adventure',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, 'Budget optimization completed');

      // Original was 6900, optimized is 300 + 1200 + 200 = 1700
      assert.strictEqual(res.body.data.originalBudget.estimatedTotal, 6900);
      assert.strictEqual(res.body.data.optimizedBudget.estimatedTotal, 1700);
      assert.strictEqual(res.body.data.savings, 5200); // 6900 - 1700
      assert.strictEqual(res.body.data.achievedTarget, true);
      assert.ok(res.body.data.tradeOffs.length > 0);
    });
  });

  // Test Case 5: Safe Error Handling on Provider Failure
  describe('Test Case 5: Safe Error Handling on Provider Failure', () => {
    it('should return safe 503 error without fake itineraries when API key is missing', async () => {
      aiService.setCustomGenerator(undefined); // ensure real client initialization is triggered
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      try {
        const res = await request(app)
          .post('/api/itineraries/generate')
          .send({
            destination: 'Manali',
            durationDays: 3,
            budget: 10000,
            travellers: 2,
            travelStyle: 'adventure',
          });

        assert.strictEqual(res.status, 503);
        assert.strictEqual(res.body.success, false);
        assert.strictEqual(res.body.data, null);
        assert.ok(res.body.message.includes('not configured'));
      } finally {
        process.env.GEMINI_API_KEY = originalKey;
      }
    });

    it('should return safe 504 on upstream timeout without exposing stack traces', async () => {
      aiService.setCustomGenerator(async () => {
        const timeoutErr = new Error('request timed out');
        timeoutErr.name = 'TimeoutError';
        throw timeoutErr;
      });

      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({
          destination: 'Manali',
          durationDays: 3,
          budget: 10000,
          travellers: 2,
          travelStyle: 'adventure',
        });

      assert.strictEqual(res.status, 504);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.data, null);
      assert.ok(res.body.message.includes('timed out'));
    });
  });

  // Test Case 6: Health Endpoint & Process Verification
  describe('Test Case 6: Health & Server Process Status', () => {
    it('GET /api/health returns 200 with server status', async () => {
      const res = await request(app).get('/api/health');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, 'TripGenie AI backend is running');
      assert.strictEqual(res.body.data.status, 'healthy');
      assert.ok(typeof res.body.data.uptime === 'number');
    });
  });
});
