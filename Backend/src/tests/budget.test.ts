import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app';
import { aiService } from '../services/aiService';
import { budgetService, BudgetService } from '../services/budgetService';
import { budgetOptimizerService } from '../services/budgetOptimizerService';
import { ItineraryResponse } from '../schemas/itineraryResponse';

describe('Part 4: Budget Calculation and Smart Budget Optimization', () => {
  const sampleItinerary: ItineraryResponse = {
    trip: {
      destination: 'Manali',
      durationDays: 2,
      currency: 'INR',
    },
    days: [
      {
        day: 1,
        theme: 'Day 1 Exploration',
        activities: [
          {
            period: 'morning',
            title: 'Cab to Hotel & Check-in',
            description: 'Private transfer from bus terminal to resort.',
            category: 'travel',
            durationMinutes: 60,
            estimatedCost: 800,
            costStatus: 'ai_estimate',
            pricingType: 'group',
          },
          {
            period: 'afternoon',
            title: 'Resort Accommodation (Day 1)',
            description: 'Deluxe double room lodging.',
            category: 'accommodation',
            durationMinutes: 120,
            estimatedCost: 3000,
            costStatus: 'ai_estimate',
            pricingType: 'group',
          },
          {
            period: 'evening',
            title: 'Welcome Dinner & Drinks',
            description: 'Traditional Himachali dinner.',
            category: 'food',
            durationMinutes: 90,
            estimatedCost: 600,
            costStatus: 'ai_estimate',
            pricingType: 'per_person', // 600 * 2 = 1200 for 2 travellers
          },
        ],
      },
      {
        day: 2,
        theme: 'Day 2 Adventures',
        activities: [
          {
            period: 'morning',
            title: 'Solang Adventure Pass',
            description: 'Entry and activities.',
            category: 'adventure',
            durationMinutes: 180,
            estimatedCost: 1500,
            costStatus: 'ai_estimate',
            pricingType: 'per_person', // 1500 * 2 = 3000
          },
          {
            period: 'afternoon',
            title: 'Handicraft Market Shopping',
            description: 'Local shawls and souvenirs.',
            category: 'shopping',
            durationMinutes: 120,
            estimatedCost: 1000,
            costStatus: 'ai_estimate',
            pricingType: 'group',
          },
          {
            period: 'evening',
            title: 'Luggage Storage & Tips',
            description: 'Tips and miscellaneous transit fee.',
            category: 'other',
            durationMinutes: 30,
            estimatedCost: 400,
            costStatus: 'ai_estimate',
            pricingType: 'group',
          },
        ],
      },
    ],
    notes: ['AI estimates only.'],
  };

  afterEach(() => {
    aiService.setCustomGenerator(undefined);
  });

  // 1 & 2: Category Totals & Grand Total Calculations
  describe('1 & 2. Category & Grand Total Calculations', () => {
    it('should accurately calculate category totals and grand total', () => {
      // transport: 800
      // accommodation: 3000
      // food: 600 * 2 = 1200
      // activities: 1500 * 2 = 3000
      // shopping: 1000
      // miscellaneous: 400
      // Grand total = 800 + 3000 + 1200 + 3000 + 1000 + 400 = 9400
      const budget = budgetService.calculateBudget(sampleItinerary, 10000, 2);

      assert.strictEqual(budget.categoryTotals.transport, 800);
      assert.strictEqual(budget.categoryTotals.accommodation, 3000);
      assert.strictEqual(budget.categoryTotals.food, 1200);
      assert.strictEqual(budget.categoryTotals.activities, 3000);
      assert.strictEqual(budget.categoryTotals.shopping, 1000);
      assert.strictEqual(budget.categoryTotals.miscellaneous, 400);
      assert.strictEqual(budget.estimatedTotal, 9400);
    });
  });

  // 3 & 4: Budget Difference & Per-Person Cost
  describe('3 & 4. Budget Difference and Per-Person Calculations', () => {
    it('should calculate positive difference when under budget', () => {
      const budget = budgetService.calculateBudget(sampleItinerary, 10000, 2);
      // userBudget 10000 - estimated 9400 = 600
      assert.strictEqual(budget.difference, 600);
      assert.strictEqual(budget.estimatedPerPerson, 4700); // 9400 / 2
    });

    it('should calculate negative difference when over budget', () => {
      const budget = budgetService.calculateBudget(sampleItinerary, 8000, 2);
      // userBudget 8000 - estimated 9400 = -1400
      assert.strictEqual(budget.difference, -1400);
      assert.strictEqual(budget.estimatedPerPerson, 4700);
    });
  });

  // 5, 6, 7: Budget Status (under, within, over)
  describe('5, 6, 7. Budget Status Determination', () => {
    it('should classify as under_budget when well below user budget', () => {
      const budget = budgetService.calculateBudget(sampleItinerary, 15000, 2);
      assert.strictEqual(budget.status, 'under_budget');
    });

    it('should classify as within_budget when within tolerance window', () => {
      // 9400 is within 3% tolerance of 9500 (tolerance is 285)
      const budget = budgetService.calculateBudget(sampleItinerary, 9500, 2);
      assert.strictEqual(budget.status, 'within_budget');
    });

    it('should classify as over_budget and produce a warning when exceeding budget', () => {
      const budget = budgetService.calculateBudget(sampleItinerary, 8000, 2);
      assert.strictEqual(budget.status, 'over_budget');
      assert.ok(budget.warning);
      assert.ok(budget.warning.includes('exceeds your budget'));
      assert.ok(budget.warning.includes('1,400'));
    });
  });

  // 8 & 9: Zero/Invalid Travellers & Monetary Validation
  describe('8 & 9. Input Validation for Travellers & Financials', () => {
    it('should reject zero or negative traveller counts', () => {
      assert.throws(
        () => budgetService.calculateBudget(sampleItinerary, 10000, 0),
        /Number of travellers must be a positive integer/
      );
      assert.throws(
        () => budgetService.calculateBudget(sampleItinerary, 10000, -2),
        /Number of travellers must be a positive integer/
      );
    });

    it('should reject negative or non-finite budget values', () => {
      assert.throws(
        () => budgetService.calculateBudget(sampleItinerary, -500, 2),
        /User budget must be a finite, non-negative number/
      );
      assert.throws(
        () => budgetService.calculateBudget(sampleItinerary, Infinity, 2),
        /User budget must be a finite, non-negative number/
      );
    });

    it('should throw when encountering negative activity costs', () => {
      const invalidItinerary: ItineraryResponse = {
        ...sampleItinerary,
        days: [
          {
            day: 1,
            activities: [
              {
                period: 'morning',
                title: 'Corrupted cost',
                description: 'test',
                category: 'culture',
                estimatedCost: -200,
                costStatus: 'ai_estimate',
              },
            ],
          },
        ],
      };

      assert.throws(
        () => budgetService.calculateBudget(invalidItinerary, 5000, 2),
        /Activity cost cannot be negative/
      );
    });
  });

  // 10: Missing Category Estimates
  describe('10. Handling Missing Category Estimates & Completeness', () => {
    it('should flag incomplete budget when categories have no estimates', () => {
      const partialItinerary: ItineraryResponse = {
        trip: { destination: 'Goa', durationDays: 1, currency: 'INR' },
        days: [
          {
            day: 1,
            activities: [
              {
                period: 'morning',
                title: 'Beach Walk',
                description: 'Free activity',
                category: 'sightseeing',
                estimatedCost: null, // Unestimated
                costStatus: 'free',
              },
            ],
          },
        ],
        notes: [],
      };

      const budget = budgetService.calculateBudget(partialItinerary, 5000, 1);
      assert.strictEqual(budget.isComplete, false);
      assert.ok(budget.unestimatedCategories.length > 0);
      assert.ok(budget.warning?.includes('missing or incomplete'));
    });
  });

  // 11 & 12: Shared Accommodation vs Per-Person Accounting
  describe('11 & 12. Accounting Rules: Shared Accommodation & Pricing Types', () => {
    it('should NOT multiply shared accommodation by traveller count', () => {
      const lodgingItinerary: ItineraryResponse = {
        trip: { destination: 'Ooty', durationDays: 1, currency: 'INR' },
        days: [
          {
            day: 1,
            activities: [
              {
                period: 'morning',
                title: 'Shared Villa Booking',
                description: 'Group villa stay',
                category: 'accommodation',
                estimatedCost: 5000,
                pricingType: 'group',
              },
            ],
          },
        ],
        notes: [],
      };

      // 4 travellers, cost should remain 5000 for the group, NOT 20000
      const budget = budgetService.calculateBudget(lodgingItinerary, 10000, 4);
      assert.strictEqual(budget.categoryTotals.accommodation, 5000);
      assert.strictEqual(budget.estimatedTotal, 5000);
      assert.strictEqual(budget.estimatedPerPerson, 1250); // 5000 / 4
    });

    it('should correctly multiply explicit per_person costs by traveller count', () => {
      const perPersonItinerary: ItineraryResponse = {
        trip: { destination: 'Agra', durationDays: 1, currency: 'INR' },
        days: [
          {
            day: 1,
            activities: [
              {
                period: 'morning',
                title: 'Taj Mahal Monument Ticket',
                description: 'Entry ticket per person',
                category: 'culture',
                estimatedCost: 250,
                pricingType: 'per_person',
              },
            ],
          },
        ],
        notes: [],
      };

      const budget = budgetService.calculateBudget(perPersonItinerary, 2000, 4);
      // 250 * 4 = 1000
      assert.strictEqual(budget.categoryTotals.activities, 1000);
      assert.strictEqual(budget.estimatedTotal, 1000);
      assert.strictEqual(budget.estimatedPerPerson, 250);
    });
  });

  // 13: Prevention of Double Counting
  describe('13. Prevention of Double Counting', () => {
    it('should ensure each activity is counted exactly once', () => {
      const budget = budgetService.calculateBudget(sampleItinerary, 10000, 2);
      const sumOfCategories = Object.values(budget.categoryTotals).reduce(
        (sum, val) => sum + val,
        0
      );
      assert.strictEqual(budget.estimatedTotal, sumOfCategories);
    });
  });

  // 14: Recalculation after itinerary edits/changes
  describe('14. Recalculation After Activity Modifications', () => {
    it('should recalculate correctly after replacing an activity', () => {
      const newActivity = {
        period: 'morning' as const,
        title: 'Budget Shared Auto',
        description: 'Cheaper transit option',
        category: 'travel' as const,
        estimatedCost: 200, // Reduced from 800 to 200 (600 savings)
        pricingType: 'group' as const,
      };

      const { budget: revisedBudget } =
        budgetService.recalculateAfterActivityChange(
          sampleItinerary,
          1,
          0,
          newActivity,
          10000,
          2
        );

      assert.strictEqual(revisedBudget.categoryTotals.transport, 200);
      assert.strictEqual(revisedBudget.estimatedTotal, 8800); // 9400 - 600
      assert.strictEqual(revisedBudget.difference, 1200);
    });

    it('should recalculate correctly after removing an activity', () => {
      // Remove the 1000 INR shopping activity from day 2 (activity index 1)
      const { budget: revisedBudget } =
        budgetService.recalculateAfterActivityRemoval(
          sampleItinerary,
          2,
          1,
          10000,
          2
        );

      assert.strictEqual(revisedBudget.categoryTotals.shopping, 0);
      assert.strictEqual(revisedBudget.estimatedTotal, 8400); // 9400 - 1000
      assert.strictEqual(revisedBudget.difference, 1600);
    });
  });

  // 15, 16, 17: Smart Budget Optimizer Service
  describe('15, 16, 17. Smart Budget Optimization Service', () => {
    it('should successfully optimize an over-budget itinerary to meet target', async () => {
      const lowerCostProposal: ItineraryResponse = {
        trip: { destination: 'Manali', durationDays: 2, currency: 'INR' },
        days: [
          {
            day: 1,
            activities: [
              {
                period: 'morning',
                title: 'Public Bus to Homestay',
                description: 'Local bus instead of private cab',
                category: 'travel',
                estimatedCost: 100,
                pricingType: 'group',
              },
              {
                period: 'afternoon',
                title: 'Homestay Stay',
                description: 'Cozy budget homestay',
                category: 'accommodation',
                estimatedCost: 1500,
                pricingType: 'group',
              },
            ],
          },
          {
            day: 2,
            activities: [
              {
                period: 'morning',
                title: 'Free Nature Trail Walk',
                description: 'Self-guided hike',
                category: 'adventure',
                estimatedCost: 200,
                pricingType: 'group',
              },
            ],
          },
        ],
        notes: ['Swapped private taxi for bus and resort for homestay.'],
      };

      aiService.setCustomGenerator(async () => ({
        text: JSON.stringify(lowerCostProposal),
      }));

      const result = await budgetOptimizerService.optimizeBudget({
        itinerary: sampleItinerary, // Originally 9400
        userBudget: 3000, // Target 3000
        travellers: 2,
      });

      assert.strictEqual(result.originalBudget.estimatedTotal, 9400);
      assert.strictEqual(result.optimizedBudget.estimatedTotal, 1800); // 100 + 1500 + 200
      assert.strictEqual(result.savings, 7600); // 9400 - 1800
      assert.strictEqual(result.achievedTarget, true);
      assert.ok(result.tradeOffs.length > 0);
    });

    it('should honestly report when optimizer alternative is still over budget', async () => {
      const slightlyReducedProposal: ItineraryResponse = {
        ...sampleItinerary,
        days: [
          {
            day: 1,
            activities: [
              {
                period: 'morning',
                title: 'Slightly cheaper hotel',
                description: 'standard room',
                category: 'accommodation',
                estimatedCost: 5000,
                pricingType: 'group',
              },
            ],
          },
          {
            day: 2,
            activities: [
              {
                period: 'morning',
                title: 'Local attraction',
                description: 'entry',
                category: 'activities',
                estimatedCost: 1000,
                pricingType: 'group',
              },
            ],
          },
        ],
      };

      aiService.setCustomGenerator(async () => ({
        text: JSON.stringify(slightlyReducedProposal),
      }));

      // userBudget 4000, optimized total is 6000 (still over budget)
      const result = await budgetOptimizerService.optimizeBudget({
        itinerary: sampleItinerary,
        userBudget: 4000,
        travellers: 2,
      });

      assert.strictEqual(result.achievedTarget, false);
      assert.strictEqual(result.optimizedBudget.status, 'over_budget');
      assert.strictEqual(result.savings, 3400); // 9400 - 6000
    });

    it('should safely preserve original itinerary when optimization fails', async () => {
      aiService.setCustomGenerator(async () => ({
        text: 'Invalid non-json response from AI',
      }));

      await assert.rejects(
        async () =>
          budgetOptimizerService.optimizeBudget({
            itinerary: sampleItinerary,
            userBudget: 5000,
            travellers: 2,
          }),
        /AI provider/
      );

      // Verify sampleItinerary was not mutated
      assert.strictEqual(sampleItinerary.days.length, 2);
      assert.strictEqual(sampleItinerary.days[0].activities.length, 3);
    });
  });

  // 18: API Integration (POST /generate & POST /optimize-budget)
  describe('18. HTTP API Endpoint Integration', () => {
    it('POST /api/itineraries/generate includes complete budget breakdown', async () => {
      aiService.setCustomGenerator(async () => ({
        text: JSON.stringify(sampleItinerary),
      }));

      const res = await request(app)
        .post('/api/itineraries/generate')
        .send({
          destination: 'Manali',
          durationDays: 2,
          budget: 10000,
          travellers: 2,
          travelStyle: 'adventure',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.budget);
      assert.strictEqual(res.body.data.budget.userBudget, 10000);
      assert.strictEqual(res.body.data.budget.estimatedTotal, 9400);
      assert.strictEqual(res.body.data.budget.difference, 600);
      assert.strictEqual(res.body.data.budget.status, 'under_budget');
    });

    it('POST /api/itineraries/optimize-budget executes optimization workflow', async () => {
      const optimizedItinerary: ItineraryResponse = {
        trip: { destination: 'Manali', durationDays: 2, currency: 'INR' },
        days: [
          {
            day: 1,
            activities: [
              {
                period: 'morning',
                title: 'Homestay Stay',
                description: 'Affordable homestay',
                category: 'accommodation',
                estimatedCost: 2000,
                pricingType: 'group',
              },
            ],
          },
          {
            day: 2,
            activities: [
              {
                period: 'morning',
                title: 'Walking Tour',
                description: 'Free tour',
                category: 'sightseeing',
                estimatedCost: 200,
                pricingType: 'group',
              },
            ],
          },
        ],
        notes: ['Selected homestay to stay within budget.'],
      };

      aiService.setCustomGenerator(async () => ({
        text: JSON.stringify(optimizedItinerary),
      }));

      const res = await request(app)
        .post('/api/itineraries/optimize-budget')
        .send({
          itinerary: sampleItinerary,
          userBudget: 5000,
          travellers: 2,
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, 'Budget optimization completed');
      assert.strictEqual(res.body.data.originalBudget.estimatedTotal, 9400);
      assert.strictEqual(res.body.data.optimizedBudget.estimatedTotal, 2200);
      assert.strictEqual(res.body.data.savings, 7200);
      assert.strictEqual(res.body.data.achievedTarget, true);
    });

    it('POST /api/itineraries/optimize-budget rejects malformed payloads with 400', async () => {
      const res = await request(app)
        .post('/api/itineraries/optimize-budget')
        .send({
          itinerary: { corrupted: true },
          userBudget: -100,
          travellers: 0,
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Validation failed');
    });
  });
});
