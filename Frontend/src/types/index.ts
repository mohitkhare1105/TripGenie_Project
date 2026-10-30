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
  durationMinutes?: number;
  estimatedCost?: number | null;
  costStatus?: CostStatus;
  pricingType?: 'group' | 'per_person';
  expenseCategory?: string;
  location?: string;
  suggestedTime?: string;
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

export type BudgetCategory =
  | 'transport'
  | 'accommodation'
  | 'food'
  | 'activities'
  | 'shopping'
  | 'miscellaneous';

export interface CategoryTotals {
  transport: number;
  accommodation: number;
  food: number;
  activities: number;
  shopping: number;
  miscellaneous: number;
}

export type BudgetStatus = 'under_budget' | 'within_budget' | 'over_budget';

export interface BudgetBreakdown {
  currency: string;
  userBudget: number;
  categoryTotals: CategoryTotals;
  estimatedTotal: number;
  difference: number;
  estimatedPerPerson: number;
  status: BudgetStatus;
  isComplete: boolean;
  unestimatedCategories: BudgetCategory[];
  warning?: string | null;
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

