import { z } from 'zod';

/**
 * Configurable boundary limits and constraints for itinerary generation.
 * Assumptions:
 * - DESTINATION_MAX_LENGTH: Destinations beyond 100 characters are impractical or malicious.
 * - STARTING_CITY_MAX_LENGTH: Standard city naming boundary.
 * - MIN_DURATION_DAYS (1) to MAX_DURATION_DAYS (30): Covers short getaways to month-long trips.
 * - MIN_BUDGET (1) to MAX_BUDGET (10,000,000): Ensures positive finite monetary values.
 * - MIN_TRAVELLERS (1) to MAX_TRAVELLERS (50): Supports solo to large group/tour travel.
 * - INTERESTS_MAX_ITEMS (15), INTEREST_ITEM_MAX_LENGTH (50): Limits prompt bloat.
 * - DIETARY_MAX_ITEMS (10), DIETARY_ITEM_MAX_LENGTH (50), DIETARY_STRING_MAX_LENGTH (200).
 * - ACCESSIBILITY_MAX_LENGTH (500), NOTES_MAX_LENGTH (1000): Reasonable free-text note limits.
 */
export const ITINERARY_LIMITS = {
  DESTINATION_MAX_LENGTH: 100,
  STARTING_CITY_MAX_LENGTH: 100,
  MIN_DURATION_DAYS: 1,
  MAX_DURATION_DAYS: 30,
  MIN_BUDGET: 1,
  MAX_BUDGET: 10_000_000,
  MIN_TRAVELLERS: 1,
  MAX_TRAVELLERS: 50,
  INTERESTS_MAX_ITEMS: 15,
  INTEREST_ITEM_MAX_LENGTH: 50,
  DIETARY_MAX_ITEMS: 10,
  DIETARY_ITEM_MAX_LENGTH: 50,
  DIETARY_STRING_MAX_LENGTH: 200,
  ACCESSIBILITY_MAX_LENGTH: 500,
  NOTES_MAX_LENGTH: 1000,
} as const;

export const TRAVEL_STYLES = [
  'adventure',
  'relaxation',
  'family',
  'solo',
  'culture',
  'food',
] as const;

export const ACCOMMODATION_PREFERENCES = [
  'budget',
  'standard',
  'comfort',
] as const;

export const TRANSPORT_PREFERENCES = [
  'public transport',
  'walking',
  'taxi',
  'rental vehicle',
] as const;

/**
 * Zod schema for TripGenie AI itinerary generation requests.
 * Uses strict mode to reject any unexpected properties.
 */
export const itineraryRequestSchema = z
  .object({
    // Required fields
    destination: z
      .string({
        required_error: 'Destination is required',
        invalid_type_error: 'Destination must be a string',
      })
      .trim()
      .min(1, 'Destination cannot be empty')
      .max(
        ITINERARY_LIMITS.DESTINATION_MAX_LENGTH,
        `Destination cannot exceed ${ITINERARY_LIMITS.DESTINATION_MAX_LENGTH} characters`
      ),

    durationDays: z
      .number({
        required_error: 'Duration (days) is required',
        invalid_type_error: 'Duration must be a number',
      })
      .int('Duration must be a positive integer')
      .positive('Duration must be a positive integer')
      .min(
        ITINERARY_LIMITS.MIN_DURATION_DAYS,
        `Duration must be at least ${ITINERARY_LIMITS.MIN_DURATION_DAYS} day`
      )
      .max(
        ITINERARY_LIMITS.MAX_DURATION_DAYS,
        `Duration cannot exceed ${ITINERARY_LIMITS.MAX_DURATION_DAYS} days`
      ),

    budget: z
      .number({
        required_error: 'Budget is required',
        invalid_type_error: 'Budget must be a number',
      })
      .finite('Budget must be a finite number')
      .positive('Budget must be greater than 0')
      .min(
        ITINERARY_LIMITS.MIN_BUDGET,
        `Budget must be at least ${ITINERARY_LIMITS.MIN_BUDGET}`
      )
      .max(
        ITINERARY_LIMITS.MAX_BUDGET,
        `Budget cannot exceed ${ITINERARY_LIMITS.MAX_BUDGET}`
      ),

    travellers: z
      .number({
        required_error: 'Number of travellers is required',
        invalid_type_error: 'Number of travellers must be a number',
      })
      .int('Number of travellers must be a positive integer')
      .positive('Number of travellers must be a positive integer')
      .min(
        ITINERARY_LIMITS.MIN_TRAVELLERS,
        `Number of travellers must be at least ${ITINERARY_LIMITS.MIN_TRAVELLERS}`
      )
      .max(
        ITINERARY_LIMITS.MAX_TRAVELLERS,
        `Number of travellers cannot exceed ${ITINERARY_LIMITS.MAX_TRAVELLERS}`
      ),

    travelStyle: z.enum(TRAVEL_STYLES, {
      errorMap: (issue) => {
        if (issue.code === 'invalid_enum_value') {
          return {
            message: `Travel style must be one of: ${TRAVEL_STYLES.join(', ')}`,
          };
        }
        return { message: 'Travel style is required' };
      },
    }),

    // Optional fields
    startingCity: z
      .string({ invalid_type_error: 'Starting city must be a string' })
      .trim()
      .min(1, 'Starting city cannot be empty')
      .max(
        ITINERARY_LIMITS.STARTING_CITY_MAX_LENGTH,
        `Starting city cannot exceed ${ITINERARY_LIMITS.STARTING_CITY_MAX_LENGTH} characters`
      )
      .optional(),

    interests: z
      .array(
        z
          .string({ invalid_type_error: 'Each interest must be a string' })
          .trim()
          .min(1, 'Interest cannot be empty')
          .max(
            ITINERARY_LIMITS.INTEREST_ITEM_MAX_LENGTH,
            `Interest item cannot exceed ${ITINERARY_LIMITS.INTEREST_ITEM_MAX_LENGTH} characters`
          ),
        { invalid_type_error: 'Interests must be an array of strings' }
      )
      .max(
        ITINERARY_LIMITS.INTERESTS_MAX_ITEMS,
        `Cannot provide more than ${ITINERARY_LIMITS.INTERESTS_MAX_ITEMS} interests`
      )
      .optional(),

    accommodationPreference: z
      .enum(ACCOMMODATION_PREFERENCES, {
        errorMap: () => ({
          message: `Accommodation preference must be one of: ${ACCOMMODATION_PREFERENCES.join(
            ', '
          )}`,
        }),
      })
      .optional(),

    transportPreference: z
      .enum(TRANSPORT_PREFERENCES, {
        errorMap: () => ({
          message: `Transport preference must be one of: ${TRANSPORT_PREFERENCES.join(
            ', '
          )}`,
        }),
      })
      .optional(),

    dietaryPreferences: z
      .union(
        [
          z
            .array(
              z
                .string({
                  invalid_type_error: 'Each dietary preference must be a string',
                })
                .trim()
                .min(1, 'Dietary preference cannot be empty')
                .max(
                  ITINERARY_LIMITS.DIETARY_ITEM_MAX_LENGTH,
                  `Dietary preference item cannot exceed ${ITINERARY_LIMITS.DIETARY_ITEM_MAX_LENGTH} characters`
                ),
              {
                invalid_type_error:
                  'Dietary preferences must be an array of strings or a string',
              }
            )
            .max(
              ITINERARY_LIMITS.DIETARY_MAX_ITEMS,
              `Cannot provide more than ${ITINERARY_LIMITS.DIETARY_MAX_ITEMS} dietary preferences`
            ),
          z
            .string({
              invalid_type_error:
                'Dietary preferences must be an array of strings or a string',
            })
            .trim()
            .min(1, 'Dietary preference cannot be empty')
            .max(
              ITINERARY_LIMITS.DIETARY_STRING_MAX_LENGTH,
              `Dietary preference description cannot exceed ${ITINERARY_LIMITS.DIETARY_STRING_MAX_LENGTH} characters`
            ),
        ],
        {
          errorMap: () => ({
            message:
              'Dietary preferences must be an array of strings or a string description',
          }),
        }
      )
      .optional(),

    accessibilityRequirements: z
      .string({
        invalid_type_error: 'Accessibility requirements must be a string',
      })
      .trim()
      .min(1, 'Accessibility requirements cannot be empty')
      .max(
        ITINERARY_LIMITS.ACCESSIBILITY_MAX_LENGTH,
        `Accessibility requirements cannot exceed ${ITINERARY_LIMITS.ACCESSIBILITY_MAX_LENGTH} characters`
      )
      .optional(),

    additionalNotes: z
      .string({ invalid_type_error: 'Additional notes must be a string' })
      .trim()
      .min(1, 'Additional notes cannot be empty')
      .max(
        ITINERARY_LIMITS.NOTES_MAX_LENGTH,
        `Additional notes cannot exceed ${ITINERARY_LIMITS.NOTES_MAX_LENGTH} characters`
      )
      .optional(),
  })
  .strict();

export type ItineraryRequest = z.infer<typeof itineraryRequestSchema>;

