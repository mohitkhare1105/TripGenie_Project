from decimal import Decimal, ROUND_HALF_UP
import math
from typing import Dict, List, Optional, Set, Tuple
from app.schemas.itinerary import ItineraryResponse, ActivityItem
from app.schemas.budget import (
    BudgetBreakdown,
    CategoryTotals,
    BudgetCategoryType,
    BudgetStatusType,
    BUDGET_CATEGORIES,
)

# Budget business rules matching budgetService.ts
TOLERANCE_RATIO = 0.03
MIN_TOLERANCE_BUFFER = 100.0


def normalize_to_budget_category(
    category: Optional[str] = None,
    explicit_expense_category: Optional[str] = None,
) -> BudgetCategoryType:
    """
    Normalizes an activity category or explicit category to one of the 6 core budget categories.
    """
    if explicit_expense_category and explicit_expense_category in BUDGET_CATEGORIES:
        return explicit_expense_category  # type: ignore

    normalized = (category or "").lower().strip()
    if normalized in ("transport", "travel"):
        return "transport"
    elif normalized in ("accommodation", "hotel", "lodging", "stay"):
        return "accommodation"
    elif normalized in ("food", "dining", "meal", "drinks"):
        return "food"
    elif normalized == "shopping":
        return "shopping"
    elif normalized in (
        "sightseeing",
        "adventure",
        "culture",
        "relaxation",
        "nature",
        "entertainment",
        "activities",
    ):
        return "activities"
    return "miscellaneous"


def compute_activity_cost(
    activity: ActivityItem,
    travellers: int,
) -> Tuple[Optional[float], Optional[float], BudgetCategoryType, bool]:
    """
    Computes group cost for an activity:
    - Null/None cost is tracked as unestimated (not 0).
    - 'per_person' pricing is multiplied by travellers.
    - 'group' pricing is shared and not multiplied.
    Returns: (base_cost, effective_group_cost, category, is_estimated)
    """
    category = normalize_to_budget_category(activity.category, activity.expenseCategory)

    if activity.estimatedCost is None or not math.isfinite(activity.estimatedCost):
        return None, None, category, False

    if activity.estimatedCost < 0:
        raise ValueError(f"Activity cost cannot be negative: {activity.estimatedCost}")

    if activity.pricingType == "per_person":
        effective = round(activity.estimatedCost * travellers)
    else:
        effective = round(activity.estimatedCost)

    return activity.estimatedCost, float(effective), category, True


def determine_budget_status(estimated_total: float, user_budget: float) -> BudgetStatusType:
    """
    Determines budget classification within symmetric tolerance window (+/- 3% or min 100 INR).
    """
    tolerance = max(MIN_TOLERANCE_BUFFER, round(user_budget * TOLERANCE_RATIO))

    if estimated_total > user_budget + tolerance:
        return "over_budget"
    elif estimated_total < user_budget - tolerance:
        return "under_budget"
    else:
        return "within_budget"


def build_budget_warning(
    status: BudgetStatusType,
    estimated_total: float,
    user_budget: float,
    is_complete: bool,
    unestimated_categories: List[BudgetCategoryType],
) -> Optional[str]:
    """
    Builds transparent warnings when cost exceeds budget or data is incomplete.
    """
    if status == "over_budget":
        excess = int(estimated_total - user_budget)
        return (
            f"The estimated trip cost (INR {int(estimated_total):,}) exceeds your budget "
            f"(INR {int(user_budget):,}) by INR {excess:,}. "
            "Consider reducing accommodation, transportation, or activity expenses."
        )

    if not is_complete and unestimated_categories:
        categories_str = ", ".join(unestimated_categories)
        return (
            f"Note: Cost estimates are missing or incomplete for {categories_str}. "
            "The displayed total represents a partial estimate, not a guaranteed total trip cost."
        )

    return None


class BudgetService:
    """
    Deterministic server-side travel budget calculation engine.
    """

    def calculate_budget(
        self,
        itinerary: ItineraryResponse,
        user_budget: float,
        travellers: int,
    ) -> BudgetBreakdown:
        if not math.isfinite(user_budget) or user_budget < 0:
            raise ValueError("User budget must be a finite, non-negative number")
        if travellers <= 0:
            raise ValueError("Number of travellers must be a positive integer")

        category_totals: Dict[str, float] = {cat: 0.0 for cat in BUDGET_CATEGORIES}
        categories_with_estimates: Set[BudgetCategoryType] = set()
        total_estimated_activities = 0
        total_unestimated_activities = 0

        for day in itinerary.days:
            for activity in day.activities:
                _, effective_cost, cat, is_est = compute_activity_cost(activity, travellers)
                if is_est and effective_cost is not None:
                    category_totals[cat] += effective_cost
                    categories_with_estimates.add(cat)
                    total_estimated_activities += 1
                else:
                    total_unestimated_activities += 1

        unestimated_categories = [
            cat for cat in BUDGET_CATEGORIES if cat not in categories_with_estimates
        ]
        is_complete = len(unestimated_categories) == 0 and total_unestimated_activities == 0

        estimated_total = round(sum(category_totals.values()))
        difference = round(user_budget - estimated_total, 2)
        estimated_per_person = round(estimated_total / travellers) if travellers > 0 else 0.0
        status = determine_budget_status(estimated_total, user_budget)

        warning = build_budget_warning(
            status,
            estimated_total,
            user_budget,
            is_complete,
            unestimated_categories,  # type: ignore
        )

        return BudgetBreakdown(
            currency=itinerary.trip.currency or "INR",
            userBudget=float(user_budget),
            categoryTotals=CategoryTotals(**category_totals),
            estimatedTotal=float(estimated_total),
            difference=float(difference),
            estimatedPerPerson=float(estimated_per_person),
            status=status,
            isComplete=is_complete,
            unestimatedCategories=unestimated_categories,  # type: ignore
            warning=warning,
        )

    def recalculate_after_activity_change(
        self,
        itinerary: ItineraryResponse,
        day_number: int,
        activity_index: int,
        new_activity: ActivityItem,
        user_budget: float,
        travellers: int,
    ) -> Tuple[ItineraryResponse, BudgetBreakdown]:
        updated_days = []
        for day in itinerary.days:
            if day.day != day_number:
                updated_days.append(day)
            else:
                if activity_index < 0 or activity_index >= len(day.activities):
                    raise ValueError(f"Activity index {activity_index} out of bounds for day {day_number}")
                new_activities = list(day.activities)
                new_activities[activity_index] = new_activity
                updated_days.append(day.model_copy(update={"activities": new_activities}))

        updated_itinerary = itinerary.model_copy(update={"days": updated_days})
        budget = self.calculate_budget(updated_itinerary, user_budget, travellers)
        return updated_itinerary, budget

    def recalculate_after_activity_removal(
        self,
        itinerary: ItineraryResponse,
        day_number: int,
        activity_index: int,
        user_budget: float,
        travellers: int,
    ) -> Tuple[ItineraryResponse, BudgetBreakdown]:
        updated_days = []
        for day in itinerary.days:
            if day.day != day_number:
                updated_days.append(day)
            else:
                if activity_index < 0 or activity_index >= len(day.activities):
                    raise ValueError(f"Activity index {activity_index} out of bounds for day {day_number}")
                if len(day.activities) <= 1:
                    raise ValueError(
                        f"Cannot remove the only activity on day {day_number}. "
                        "Each day must have at least one activity."
                    )
                new_activities = [act for idx, act in enumerate(day.activities) if idx != activity_index]
                updated_days.append(day.model_copy(update={"activities": new_activities}))

        updated_itinerary = itinerary.model_copy(update={"days": updated_days})
        budget = self.calculate_budget(updated_itinerary, user_budget, travellers)
        return updated_itinerary, budget


budget_service = BudgetService()

