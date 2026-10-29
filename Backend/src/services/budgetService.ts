import {
  BUDGET_CATEGORIES,
  BudgetCategory,
  BudgetBreakdown,
  CategoryTotals,
  BudgetStatus,
} from '../schemas/budgetSchema';
import { ItineraryResponse, ActivityItem } from '../schemas/itineraryResponse';

export const BUDGET_RULES = {
  // Symmetric tolerance ratio: +/- 3% of user budget is considered 'within_budget'
  TOLERANCE_RATIO: 0.03,
  // Minimum absolute tolerance buffer in INR
  MIN_TOLERANCE_BUFFER: 100,
} as const;

export interface ActivityCostDetail {
  baseCost: number | null;
  effectiveGroupCost: number | null;
  category: BudgetCategory;
  isEstimated: boolean;
}

/**
 * Normalizes an activity category or explicit expense category to one of the 6 core budget categories.
 */
export const normalizeToBudgetCategory = (
  category?: string,
  explicitExpenseCategory?: BudgetCategory
): BudgetCategory => {
  if (
    explicitExpenseCategory &&
    BUDGET_CATEGORIES.includes(explicitExpenseCategory)
  ) {
    return explicitExpenseCategory;
  }

  const normalized = category?.toLowerCase().trim();
  switch (normalized) {
    case 'transport':
    case 'travel':
      return 'transport';
    case 'accommodation':
    case 'hotel':
    case 'lodging':
    case 'stay':
      return 'accommodation';
    case 'food':
    case 'dining':
    case 'meal':
    case 'drinks':
      return 'food';
    case 'shopping':
      return 'shopping';
    case 'sightseeing':
    case 'adventure':
    case 'culture':
    case 'relaxation':
    case 'nature':
    case 'entertainment':
    case 'activities':
      return 'activities';
    case 'miscellaneous':
    case 'other':
    default:
      return 'miscellaneous';
  }
};

/**
 * Computes the effective group cost for an activity based on accounting rules:
 * - Null/unspecified costs are NOT treated as 0; they are tracked as unestimated.
 * - Explicit per_person pricing is multiplied by the traveller count.
 * - Shared group costs (e.g. accommodation or default group pricing) are NOT multiplied by travellers.
 */
export const computeActivityCost = (
  activity: ActivityItem,
  travellers: number
): ActivityCostDetail => {
  if (
    activity.estimatedCost === null ||
    activity.estimatedCost === undefined ||
    !Number.isFinite(activity.estimatedCost)
  ) {
    return {
      baseCost: null,
      effectiveGroupCost: null,
      category: normalizeToBudgetCategory(
        activity.category,
        activity.expenseCategory
      ),
      isEstimated: false,
    };
  }

  if (activity.estimatedCost < 0) {
    throw new Error(
      `Activity cost cannot be negative: ${activity.estimatedCost}`
    );
  }

  const category = normalizeToBudgetCategory(
    activity.category,
    activity.expenseCategory
  );
  let effectiveGroupCost: number;

  if (activity.pricingType === 'per_person') {
    // Explicit per-person pricing: multiply by total travellers
    effectiveGroupCost = Math.round(activity.estimatedCost * travellers);
  } else {
    // Group-level shared expense (default for accommodation and shared transfers)
    effectiveGroupCost = Math.round(activity.estimatedCost);
  }

  return {
    baseCost: activity.estimatedCost,
    effectiveGroupCost,
    category,
    isEstimated: true,
  };
};

/**
 * Determines budget status based on the configured tolerance window.
 */
export const determineBudgetStatus = (
  estimatedTotal: number,
  userBudget: number
): BudgetStatus => {
  const tolerance = Math.max(
    BUDGET_RULES.MIN_TOLERANCE_BUFFER,
    Math.round(userBudget * BUDGET_RULES.TOLERANCE_RATIO)
  );

  if (estimatedTotal > userBudget + tolerance) {
    return 'over_budget';
  } else if (estimatedTotal < userBudget - tolerance) {
    return 'under_budget';
  } else {
    return 'within_budget';
  }
};

/**
 * Generates clear, contextual warnings when costs exceed budget or data is incomplete.
 */
export const buildBudgetWarning = (
  status: BudgetStatus,
  estimatedTotal: number,
  userBudget: number,
  isComplete: boolean,
  unestimatedCategories: BudgetCategory[]
): string | null => {
  if (status === 'over_budget') {
    const excess = estimatedTotal - userBudget;
    return `The estimated trip cost (INR ${estimatedTotal.toLocaleString()}) exceeds your budget (INR ${userBudget.toLocaleString()}) by INR ${excess.toLocaleString()}. Consider reducing accommodation, transportation, or activity expenses.`;
  }

  if (!isComplete && unestimatedCategories.length > 0) {
    return `Note: Cost estimates are missing or incomplete for ${unestimatedCategories.join(
      ', '
    )}. The displayed total represents a partial estimate, not a guaranteed total trip cost.`;
  }

  return null;
};

/**
 * Central budget calculation service.
 * Enforces server-side arithmetic, accounting rules, and completeness tracking.
 */
export class BudgetService {
  /**
   * Calculates comprehensive budget breakdown from an itinerary.
   */
  public calculateBudget(
    itinerary: ItineraryResponse,
    userBudget: number,
    travellers: number
  ): BudgetBreakdown {
    // Validate inputs
    if (!Number.isFinite(userBudget) || userBudget < 0) {
      throw new Error('User budget must be a finite, non-negative number');
    }
    if (!Number.isInteger(travellers) || travellers <= 0) {
      throw new Error('Number of travellers must be a positive integer');
    }

    const categoryTotals: CategoryTotals = {
      transport: 0,
      accommodation: 0,
      food: 0,
      activities: 0,
      shopping: 0,
      miscellaneous: 0,
    };

    const categoriesWithEstimates = new Set<BudgetCategory>();
    let totalEstimatedActivities = 0;
    let totalUnestimatedActivities = 0;

    for (const day of itinerary.days) {
      for (const activity of day.activities) {
        const detail = computeActivityCost(activity, travellers);
        if (detail.isEstimated && detail.effectiveGroupCost !== null) {
          categoryTotals[detail.category] += detail.effectiveGroupCost;
          categoriesWithEstimates.add(detail.category);
          totalEstimatedActivities++;
        } else {
          totalUnestimatedActivities++;
        }
      }
    }

    // Determine unestimated categories
    const unestimatedCategories = BUDGET_CATEGORIES.filter(
      (category) => !categoriesWithEstimates.has(category)
    );

    const isComplete =
      unestimatedCategories.length === 0 && totalUnestimatedActivities === 0;

    const estimatedTotal = Math.round(
      categoryTotals.transport +
        categoryTotals.accommodation +
        categoryTotals.food +
        categoryTotals.activities +
        categoryTotals.shopping +
        categoryTotals.miscellaneous
    );

    const difference = userBudget - estimatedTotal;
    const estimatedPerPerson =
      travellers > 0 ? Math.round(estimatedTotal / travellers) : 0;
    const status = determineBudgetStatus(estimatedTotal, userBudget);
    const warning = buildBudgetWarning(
      status,
      estimatedTotal,
      userBudget,
      isComplete,
      unestimatedCategories
    );

    return {
      currency: itinerary.trip.currency || 'INR',
      userBudget,
      categoryTotals,
      estimatedTotal,
      difference,
      estimatedPerPerson,
      status,
      isComplete,
      unestimatedCategories,
      warning,
    };
  }

  /**
   * Recalculates budget after replacing an activity in a specific day.
   */
  public recalculateAfterActivityChange(
    itinerary: ItineraryResponse,
    dayNumber: number,
    activityIndex: number,
    newActivity: ActivityItem,
    userBudget: number,
    travellers: number
  ): { itinerary: ItineraryResponse; budget: BudgetBreakdown } {
    const updatedDays = itinerary.days.map((day) => {
      if (day.day !== dayNumber) {
        return day;
      }
      const updatedActivities = [...day.activities];
      if (activityIndex < 0 || activityIndex >= updatedActivities.length) {
        throw new Error(
          `Activity index ${activityIndex} out of bounds for day ${dayNumber}`
        );
      }
      updatedActivities[activityIndex] = newActivity;
      return { ...day, activities: updatedActivities };
    });

    const updatedItinerary: ItineraryResponse = {
      ...itinerary,
      days: updatedDays,
    };

    const budget = this.calculateBudget(updatedItinerary, userBudget, travellers);
    return { itinerary: updatedItinerary, budget };
  }

  /**
   * Recalculates budget after removing an activity from a day.
   */
  public recalculateAfterActivityRemoval(
    itinerary: ItineraryResponse,
    dayNumber: number,
    activityIndex: number,
    userBudget: number,
    travellers: number
  ): { itinerary: ItineraryResponse; budget: BudgetBreakdown } {
    const updatedDays = itinerary.days.map((day) => {
      if (day.day !== dayNumber) {
        return day;
      }
      if (activityIndex < 0 || activityIndex >= day.activities.length) {
        throw new Error(
          `Activity index ${activityIndex} out of bounds for day ${dayNumber}`
        );
      }
      if (day.activities.length <= 1) {
        throw new Error(
          `Cannot remove the only activity on day ${dayNumber}. Each day must have at least one activity.`
        );
      }
      const updatedActivities = day.activities.filter(
        (_, idx) => idx !== activityIndex
      );
      return { ...day, activities: updatedActivities };
    });

    const updatedItinerary: ItineraryResponse = {
      ...itinerary,
      days: updatedDays,
    };

    const budget = this.calculateBudget(updatedItinerary, userBudget, travellers);
    return { itinerary: updatedItinerary, budget };
  }
}

export const budgetService = new BudgetService();

