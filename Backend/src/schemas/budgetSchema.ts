import { z } from 'zod';
import { itineraryResponseSchema } from './itineraryResponse';

export const BUDGET_CATEGORIES = [
  'transport',
  'accommodation',
  'food',
  'activities',
  'shopping',
  'miscellaneous',
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export const BUDGET_STATUSES = [
  'under_budget',
  'within_budget',
  'over_budget',
] as const;

export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

/**
 * Breakdown of calculated totals by expense category in INR.
 */
export const categoryTotalsSchema = z.object({
  transport: z.number().finite().nonnegative('Transport total cannot be negative'),
  accommodation: z.number().finite().nonnegative('Accommodation total cannot be negative'),
  food: z.number().finite().nonnegative('Food total cannot be negative'),
  activities: z.number().finite().nonnegative('Activities total cannot be negative'),
  shopping: z.number().finite().nonnegative('Shopping total cannot be negative'),
  miscellaneous: z.number().finite().nonnegative('Miscellaneous total cannot be negative'),
});

export type CategoryTotals = z.infer<typeof categoryTotalsSchema>;

/**
 * Full budget breakdown and calculation status.
 */
export const budgetBreakdownSchema = z.object({
  currency: z.string().trim().default('INR'),
  userBudget: z.number().finite().nonnegative('User budget cannot be negative'),
  categoryTotals: categoryTotalsSchema,
  estimatedTotal: z.number().finite().nonnegative('Estimated total cannot be negative'),
  difference: z.number().finite('Difference must be finite'),
  estimatedPerPerson: z.number().finite().nonnegative('Per person cost cannot be negative'),
  status: z.enum(BUDGET_STATUSES),
  isComplete: z.boolean().default(true),
  unestimatedCategories: z.array(z.enum(BUDGET_CATEGORIES)).default([]),
  warning: z.string().nullable().optional(),
});

export type BudgetBreakdown = z.infer<typeof budgetBreakdownSchema>;

/**
 * Request payload for Smart Budget Optimization.
 */
export const optimizeBudgetRequestSchema = z
  .object({
    itinerary: itineraryResponseSchema,
    userBudget: z.number().finite().positive('Budget must be a positive number'),
    travellers: z.number().int().positive('Number of travellers must be a positive integer'),
    travelStyle: z.string().trim().optional(),
    interests: z.array(z.string().trim()).optional(),
    additionalNotes: z.string().trim().max(1000).optional(),
  })
  .strict();

export type OptimizeBudgetRequest = z.infer<typeof optimizeBudgetRequestSchema>;

/**
 * Response payload for Smart Budget Optimization.
 */
export const optimizeBudgetResponseSchema = z.object({
  originalBudget: budgetBreakdownSchema,
  optimizedItinerary: itineraryResponseSchema,
  optimizedBudget: budgetBreakdownSchema,
  savings: z.number().finite().nonnegative(),
  achievedTarget: z.boolean(),
  tradeOffs: z.array(z.string().trim()).default([]),
});

export type OptimizeBudgetResponse = z.infer<typeof optimizeBudgetResponseSchema>;

