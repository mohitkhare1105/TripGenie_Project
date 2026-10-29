import { z } from 'zod';

export const ACTIVITY_PERIODS = [
  'morning',
  'afternoon',
  'evening',
  'night',
] as const;

export const ACTIVITY_CATEGORIES = [
  'sightseeing',
  'adventure',
  'culture',
  'food',
  'relaxation',
  'shopping',
  'travel',
  'nature',
  'entertainment',
  'other',
] as const;

export const COST_STATUSES = [
  'ai_estimate',
  'included',
  'free',
  'unknown',
] as const;

/**
 * Schema for an individual itinerary activity.
 */
export const activityItemSchema = z.object({
  period: z.enum(ACTIVITY_PERIODS, {
    errorMap: () => ({
      message: `Period must be one of: ${ACTIVITY_PERIODS.join(', ')}`,
    }),
  }),
  title: z
    .string()
    .trim()
    .min(1, 'Activity title cannot be empty')
    .max(150, 'Activity title cannot exceed 150 characters'),
  description: z
    .string()
    .trim()
    .min(1, 'Activity description cannot be empty')
    .max(500, 'Activity description cannot exceed 500 characters'),
  category: z.enum(ACTIVITY_CATEGORIES, {
    errorMap: () => ({
      message: `Category must be one of: ${ACTIVITY_CATEGORIES.join(', ')}`,
    }),
  }),
  durationMinutes: z
    .number()
    .int('Duration minutes must be an integer')
    .positive('Duration minutes must be positive')
    .max(720, 'Duration cannot exceed 720 minutes (12 hours)')
    .optional(),
  estimatedCost: z
    .number({ invalid_type_error: 'Estimated cost must be a numeric value' })
    .finite('Estimated cost must be finite')
    .nonnegative('Estimated cost cannot be negative')
    .optional()
    .nullable(),
  costStatus: z
    .enum(COST_STATUSES, {
      errorMap: () => ({
        message: `Cost status must be one of: ${COST_STATUSES.join(', ')}`,
      }),
    })
    .default('ai_estimate'),
  location: z.string().trim().max(100).optional(),
  suggestedTime: z.string().trim().max(50).optional(),
});

/**
 * Schema for a single day plan within the itinerary.
 */
export const dayPlanSchema = z.object({
  day: z.number().int().positive('Day number must be a positive integer'),
  theme: z.string().trim().max(150).optional(),
  activities: z
    .array(activityItemSchema)
    .min(1, 'Each day must contain at least one activity'),
});

/**
 * Trip overview metadata.
 */
export const tripSummarySchema = z.object({
  destination: z.string().trim().min(1, 'Destination cannot be empty'),
  durationDays: z.number().int().positive('Duration must be a positive integer'),
  currency: z.string().trim().default('INR'),
});

/**
 * Root schema for AI-generated itinerary response.
 * Enforces sequential day numbering and matching day count.
 */
export const itineraryResponseSchema = z
  .object({
    trip: tripSummarySchema,
    days: z
      .array(dayPlanSchema)
      .min(1, 'Itinerary must include at least one day')
      .refine(
        (days) => days.every((d, index) => d.day === index + 1),
        {
          message: 'Day numbers must be sequential and unique starting from 1',
          path: ['days'],
        }
      ),
    notes: z
      .array(z.string().trim().max(500))
      .max(15)
      .default([
        'AI-generated suggestions and estimated prices have not been independently verified.',
      ]),
  })
  .refine((data) => data.days.length === data.trip.durationDays, {
    message: 'The number of days in the itinerary must match durationDays',
    path: ['days'],
  });

export type ActivityItem = z.infer<typeof activityItemSchema>;
export type DayPlan = z.infer<typeof dayPlanSchema>;
export type TripSummary = z.infer<typeof tripSummarySchema>;
export type ItineraryResponse = z.infer<typeof itineraryResponseSchema>;

