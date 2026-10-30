import pytest
from app.schemas.itinerary import ItineraryResponse, TripInfo, DayPlan, ActivityItem
from app.services.budget_service import (
    budget_service,
    compute_activity_cost,
    determine_budget_status,
)


def get_sample_itinerary():
    return ItineraryResponse(
        trip=TripInfo(destination="Manali", durationDays=2, currency="INR"),
        days=[
            DayPlan(
                day=1,
                activities=[
                    ActivityItem(
                        period="morning",
                        title="Temple Visit",
                        description="Historical shrine",
                        category="sightseeing",
                        estimatedCost=200.0,
                        pricingType="per_person",  # 200 * 2 = 400
                    ),
                    ActivityItem(
                        period="afternoon",
                        title="Local Lunch",
                        description="Himachali thali",
                        category="food",
                        estimatedCost=300.0,
                        pricingType="per_person",  # 300 * 2 = 600
                    ),
                    ActivityItem(
                        period="evening",
                        title="Resort Check-in",
                        description="Overnight stay",
                        category="accommodation",
                        estimatedCost=2500.0,
                        pricingType="group",  # shared = 2500
                    ),
                ],
            ),
            DayPlan(
                day=2,
                activities=[
                    ActivityItem(
                        period="morning",
                        title="River Trek",
                        description="Nature walk",
                        category="adventure",
                        estimatedCost=500.0,
                        pricingType="per_person",  # 500 * 2 = 1000
                    ),
                    ActivityItem(
                        period="afternoon",
                        title="Souvenirs",
                        description="Handicrafts",
                        category="shopping",
                        estimatedCost=1000.0,
                        pricingType="group",  # group = 1000
                    ),
                    ActivityItem(
                        period="evening",
                        title="Sunset Point",
                        description="Scenic view",
                        category="relaxation",
                        estimatedCost=None,  # Free/unestimated
                        costStatus="free",
                    ),
                ],
            ),
        ],
        notes=["Dress warmly."],
    )


def test_compute_activity_cost_accounting_rules():
    """Verify shared group lodging is NOT multiplied, while per_person items are."""
    shared_lodging = ActivityItem(
        period="evening",
        title="Hotel Room",
        description="Shared double room",
        category="accommodation",
        estimatedCost=3000.0,
        pricingType="group",
    )
    _, group_cost, cat, is_est = compute_activity_cost(shared_lodging, travellers=3)
    assert group_cost == 3000.0
    assert cat == "accommodation"
    assert is_est is True

    per_person_entry = ActivityItem(
        period="morning",
        title="Museum Ticket",
        description="Entry fee per visitor",
        category="sightseeing",
        estimatedCost=150.0,
        pricingType="per_person",
    )
    _, pp_cost, cat, is_est = compute_activity_cost(per_person_entry, travellers=3)
    assert pp_cost == 450.0  # 150 * 3
    assert cat == "activities"


def test_budget_calculation_accuracy():
    """Verify grand total and category breakdown match arithmetic expectations."""
    itinerary = get_sample_itinerary()
    travellers = 2
    user_budget = 10000.0

    breakdown = budget_service.calculate_budget(itinerary, user_budget, travellers)
    # Expected:
    # Day 1: 400 (activities) + 600 (food) + 2500 (accommodation) = 3500
    # Day 2: 1000 (activities) + 1000 (shopping) + 0 (free) = 2000
    # Total = 5500
    assert breakdown.categoryTotals.accommodation == 2500.0
    assert breakdown.categoryTotals.food == 600.0
    assert breakdown.categoryTotals.activities == 1400.0  # 400 + 1000
    assert breakdown.categoryTotals.shopping == 1000.0
    assert breakdown.estimatedTotal == 5500.0
    assert breakdown.difference == 4500.0  # 10000 - 5500
    assert breakdown.estimatedPerPerson == 2750.0  # 5500 / 2
    assert breakdown.status == "under_budget"


def test_determine_budget_status_tolerance():
    """Verify 3% tolerance window logic."""
    assert determine_budget_status(estimated_total=10000.0, user_budget=10000.0) == "within_budget"
    assert determine_budget_status(estimated_total=10200.0, user_budget=10000.0) == "within_budget"  # within 300 INR tolerance
    assert determine_budget_status(estimated_total=10500.0, user_budget=10000.0) == "over_budget"
    assert determine_budget_status(estimated_total=9000.0, user_budget=10000.0) == "under_budget"


def test_recalculate_after_activity_change():
    """Verify recalculate_after_activity_change correctly updates totals."""
    itinerary = get_sample_itinerary()
    new_activity = ActivityItem(
        period="morning",
        title="Private Guided Tour",
        description="Exclusive guide",
        category="sightseeing",
        estimatedCost=1000.0,
        pricingType="per_person",  # 1000 * 2 = 2000 instead of 400 (diff +1600)
    )

    updated_itin, new_budget = budget_service.recalculate_after_activity_change(
        itinerary,
        day_number=1,
        activity_index=0,
        new_activity=new_activity,
        user_budget=10000.0,
        travellers=2,
    )

    assert updated_itin.days[0].activities[0].title == "Private Guided Tour"
    assert new_budget.estimatedTotal == 5500.0 + 1600.0  # 7100.0

