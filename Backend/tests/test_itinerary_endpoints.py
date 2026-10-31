import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.itinerary import (
    ItineraryRequest,
    ItineraryResponse,
    TripInfo,
    DayPlan,
    ActivityItem,
)
from app.services.itinerary_service import itinerary_service
from app.services.budget_optimizer_service import budget_optimizer_service
from app.services.ai.itinerary_provider import (
    ItineraryProvider,
    UnconfiguredItineraryProvider,
)
from app.middleware.duplicate_request import clear_in_flight_locks

client = TestClient(app, raise_server_exceptions=False)


def get_mock_itinerary_response():
    return ItineraryResponse(
        trip=TripInfo(destination="Jaipur", durationDays=2, currency="INR"),
        days=[
            DayPlan(
                day=1,
                activities=[
                    ActivityItem(
                        period="morning",
                        title="Amber Fort",
                        description="Historic fort palace",
                        category="sightseeing",
                        estimatedCost=500.0,
                        pricingType="per_person",
                    ),
                    ActivityItem(
                        period="afternoon",
                        title="Rajasthani Thali",
                        description="Local lunch",
                        category="food",
                        estimatedCost=400.0,
                        pricingType="per_person",
                    ),
                    ActivityItem(
                        period="evening",
                        title="Heritage Haveli Stay",
                        description="Overnight lodging",
                        category="accommodation",
                        estimatedCost=3000.0,
                        pricingType="group",
                    ),
                ],
            ),
            DayPlan(
                day=2,
                activities=[
                    ActivityItem(
                        period="morning",
                        title="Hawa Mahal & City Palace",
                        description="Palace complex",
                        category="sightseeing",
                        estimatedCost=300.0,
                        pricingType="per_person",
                    ),
                    ActivityItem(
                        period="afternoon",
                        title="Bapu Bazaar",
                        description="Local shopping",
                        category="shopping",
                        estimatedCost=1000.0,
                        pricingType="group",
                    ),
                    ActivityItem(
                        period="evening",
                        title="Jal Mahal Sunset",
                        description="Lake palace view",
                        category="relaxation",
                        estimatedCost=None,
                        costStatus="free",
                    ),
                ],
            ),
        ],
        notes=["Carry sun protection during daytime."],
    )


class MockProvider(ItineraryProvider):
    async def generate_itinerary(self, request: ItineraryRequest) -> ItineraryResponse:
        return get_mock_itinerary_response()

    async def optimize_itinerary(
        self,
        prompt: str,
        system_instruction: str,
        duration_days: int,
        destination: str,
    ) -> ItineraryResponse:
        # Returns an optimized version with lower accommodation cost
        mock_resp = get_mock_itinerary_response()
        mock_resp.days[0].activities[2].estimatedCost = 1500.0  # Homestay instead of Haveli
        mock_resp.notes = ["Swapped heritage haveli for authentic homestay to reduce costs."]
        return mock_resp


@pytest.fixture(autouse=True)
def cleanup_provider():
    clear_in_flight_locks()
    original_provider = itinerary_service.provider
    original_opt_provider = budget_optimizer_service.provider
    yield
    clear_in_flight_locks()
    itinerary_service.set_provider(original_provider)
    budget_optimizer_service.provider = original_opt_provider


def test_generate_itinerary_unconfigured_provider_returns_503():
    """
    Verify Phase 3 AI boundary:
    Without configured provider, returns HTTP 503 Service Unavailable with clear notice.
    """
    itinerary_service.set_provider(UnconfiguredItineraryProvider())

    valid_payload = {
        "destination": "Jaipur",
        "durationDays": 2,
        "budget": 20000.0,
        "travellers": 2,
        "travelStyle": "culture",
    }
    response = client.post("/api/itineraries/generate", json=valid_payload)
    assert response.status_code == 503
    payload = response.json()
    assert payload["success"] is False
    assert "GROQ_API_KEY" in payload["message"] or "Groq" in payload["message"]


def test_generate_itinerary_with_mocked_provider_success():
    """Verify POST /api/itineraries/generate returns 200 with server-calculated budget."""
    itinerary_service.set_provider(MockProvider())

    valid_payload = {
        "destination": "Jaipur",
        "durationDays": 2,
        "budget": 20000.0,
        "travellers": 2,
        "travelStyle": "culture",
    }
    response = client.post("/api/itineraries/generate", json=valid_payload)
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Itinerary generated successfully"
    assert "data" in payload

    data = payload["data"]
    assert data["trip"]["destination"] == "Jaipur"
    assert len(data["days"]) == 2
    assert "budget" in data
    # Expected: (500*2 + 400*2 + 3000) + (300*2 + 1000 + 0) = 4800 + 1600 = 6400
    assert data["budget"]["estimatedTotal"] == 6400.0
    assert data["budget"]["userBudget"] == 20000.0
    assert data["budget"]["difference"] == 13600.0
    assert data["budget"]["status"] == "under_budget"


def test_generate_itinerary_validation_rejection():
    """Verify invalid payloads are rejected with 400 before provider is called."""
    mock_prov = MagicMock()
    itinerary_service.set_provider(mock_prov)

    response = client.post("/api/itineraries/generate", json={"destination": ""})
    assert response.status_code == 400
    mock_prov.generate_itinerary.assert_not_called()


def test_optimize_budget_already_within_budget():
    """Verify optimize-budget short-circuits with 200 when itinerary is already within budget."""
    sample_itin = get_mock_itinerary_response().model_dump(mode="json")
    payload = {
        "itinerary": sample_itin,
        "userBudget": 20000.0,  # Estimated is 6400, well below 20000
        "travellers": 2,
    }

    response = client.post("/api/itineraries/optimize-budget", json=payload)
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["savings"] == 0.0
    assert res_data["achievedTarget"] is True
    assert "already within" in res_data["tradeOffs"][0].lower()


def test_optimize_budget_over_budget_with_mock_provider():
    """Verify optimize-budget invokes provider and recalculates totals when over budget."""
    budget_optimizer_service.provider = MockProvider()

    sample_itin = get_mock_itinerary_response().model_dump(mode="json")
    payload = {
        "itinerary": sample_itin,
        "userBudget": 5000.0,  # Estimated is 6400, so over budget by 1400
        "travellers": 2,
    }

    response = client.post("/api/itineraries/optimize-budget", json=payload)
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["originalBudget"]["estimatedTotal"] == 6400.0
    # Optimized lodging was 1500 instead of 3000, so optimized total is 6400 - 1500 = 4900
    assert res_data["optimizedBudget"]["estimatedTotal"] == 4900.0
    assert res_data["savings"] == 1500.0
    assert res_data["achievedTarget"] is True

