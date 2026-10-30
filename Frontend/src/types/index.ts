export type TravelStyle =
  | 'adventure'
  | 'relaxation'
  | 'family'
  | 'solo'
  | 'culture'
  | 'food';

export type AccommodationPreference = 'budget' | 'standard' | 'comfort';

export type TransportPreference =
  | 'public transport'
  | 'walking'
  | 'taxi'
  | 'rental vehicle';

export interface ItineraryFormInput {
  destination: string;
  durationDays: number;
  budget: number;
  travellers: number;
  travelStyle: TravelStyle;
  startingCity?: string;
  interests?: string[];
  accommodationPreference?: AccommodationPreference;
  transportPreference?: TransportPreference;
  dietaryPreferences?: string[];
  accessibilityRequirements?: string;
  additionalNotes?: string;
}

export type ActivityPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export type ActivityCategory =
  | 'sightseeing'
  | 'adventure'
  | 'culture'
  | 'food'
  | 'relaxation'
  | 'shopping'
  | 'travel'
  | 'transport'
  | 'accommodation'
  | 'activities'
  | 'nature'
  | 'entertainment'
  | 'other';

export type CostStatus = 'ai_estimate' | 'included' | 'free' | 'unknown';

export interface ActivityItem {
  period: ActivityPeriod;
  title: string;
  description: string;
  category: ActivityCategory;
  durationMinutes?: number | null;
  estimatedCost?: number | null;
  costStatus?: CostStatus;
  pricingType?: 'group' | 'per_person';
  location?: string | null;
  suggestedTime?: string | null;
  expenseCategory?: string | null;
  // Fallback compatibility properties
  time?: string;
  activity?: string;
  notes?: string;
}

export interface DayPlan {
  day: number;
  theme?: string;
  activities: ActivityItem[];
}

export interface TripSummary {
  destination: string;
  durationDays: number;
  currency: string;
}

export interface CategoryTotals {
  transport: number;
  accommodation: number;
  food: number;
  activities: number;
  shopping: number;
  miscellaneous: number;
}

export interface BudgetBreakdown {
  currency: string;
  userBudget: number;
  categoryTotals: CategoryTotals;
  estimatedTotal: number;
  difference: number;
  estimatedPerPerson: number;
  status: 'within_budget' | 'under_budget' | 'over_budget';
  isComplete?: boolean;
  unestimatedCategories?: string[];
  warning?: string | null;
  perPersonTotal?: number;
  perDayTotal?: number;
}

export interface ItineraryData {
  trip: TripSummary;
  days: DayPlan[];
  budget: BudgetBreakdown;
  notes: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: Array<{ field: string; message: string }>;
}

export interface OptimizeBudgetResponseData {
  originalBudget: BudgetBreakdown;
  optimizedItinerary: {
    trip: TripSummary;
    days: DayPlan[];
    notes: string[];
  };
  optimizedBudget: BudgetBreakdown;
  savings: number;
  achievedTarget: boolean;
  tradeOffs: string[];
}

export interface DestinationImage {
  id: string;
  url: string;
  thumb_url: string;
  alt_description?: string;
  photographer_name?: string;
  photographer_url?: string;
  unsplash_url?: string;
}

export interface DestinationImagesData {
  query: string;
  images: DestinationImage[];
  primary_image?: DestinationImage | null;
}

export interface SavedTripRecord {
  id: string;
  user_id: string;
  destination: string;
  duration_days: number;
  budget: number;
  currency: string;
  travellers: number;
  travel_style: string;
  starting_city?: string | null;
  travel_preferences?: Record<string, unknown>;
  itinerary_data?: ItineraryData | Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface TripListResult {
  items: SavedTripRecord[];
  total: number;
}

export interface UserProfileData {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}
