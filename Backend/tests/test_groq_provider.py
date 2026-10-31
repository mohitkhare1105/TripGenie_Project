import json
from unittest.mock import AsyncMock, MagicMock, patch
import httpx
import pytest
import groq

from app.core.exceptions import AppException
from app.schemas.itinerary import (
    ItineraryRequest,
    ItineraryResponse,
    TripInfo,
    DayPlan,
    ActivityItem,
)
from app.schemas.budget import OptimizeBudgetRequest
from app.services.ai.itinerary_provider import (
    AiServiceError,
    AiServiceUnavailableError,
)
from app.services.ai.groq_provider import GroqItineraryProvider
from app.services.ai.prompts import (
    build_itinerary_prompt,
    build_optimization_prompt,
)
from app.services.itinerary_service import ItineraryService
from app.services.budget_optimizer_service import BudgetOptimizerService
from app.services.budget_service import BudgetService
from app.main import app
from starlette.testclient import TestClient


SAMPLE_GROQ_ITINERARY_DICT = {
    "trip": {
        "destination": "Goa, India",
        "durationDays": 2,
        "currency": "INR",
    },
    "days": [
        {
            "day": 1,
            "theme": "Beaches & Coastal Culture",
            "activities": [
                {
                    "period": "morning",
                    "title": "Calangute Beach Walk",
                    "description": "Morning stroll along Calangute Beach followed by breakfast.",
                    "category": "relaxation",
                    "durationMinutes": 120,
                    "estimatedCost": 300,
                    "costStatus": "ai_estimate",
                    "pricingType": "group",
                    "location": "North Goa",
                    "suggestedTime": "08:30 AM",
                },
                {
                    "period": "evening",
                    "title": "Sunset at Fort Aguada",
                    "description": "Historic 17th-century Portuguese lighthouse and fort overlooking the Arabian Sea.",
                    "category": "sightseeing",
                    "durationMinutes": 90,
                    "estimatedCost": 200,
                    "costStatus": "ai_estimate",
                    "pricingType": "per_person",
                    "location": "Sinquerim",
                    "suggestedTime": "05:00 PM",
                },
            ],
        },
        {
            "day": 2,
            "theme": "Old Goa Heritage",
            "activities": [
                {
                    "period": "morning",
                    "title": "Basilica of Bom Jesus",
                    "description": "Visit UNESCO World Heritage baroque Catholic church.",
                    "category": "culture",
                    "durationMinutes": 90,
                    "estimatedCost": 100,
                    "costStatus": "free",
                    "pricingType": "group",
                    "location": "Old Goa",
                    "suggestedTime": "09:30 AM",
                },
                {
                    "period": "afternoon",
                    "title": "Local Goan Fish Thali",
                    "description": "Authentic seafood lunch at a local eatery.",
                    "category": "food",
                    "durationMinutes": 60,
                    "estimatedCost": 600,
                    "costStatus": "ai_estimate",
                    "pricingType": "per_person",
                    "location": "Panaji",
                    "suggestedTime": "01:00 PM",
                },
            ],
        },
    ],
    "notes": [
        "Best visited during morning hours to avoid peak afternoon sun.",
        "Local scooter rentals are cost-effective for exploring North Goa.",
    ],
}


def make_mock_groq_response(content: str):
    message = MagicMock()
    message.content = content
    choice = MagicMock()
    choice.message = message
    resp = MagicMock()
    resp.choices = [choice]
    return resp


@pytest.fixture
def sample_request() -> ItineraryRequest:
    return ItineraryRequest(
        destination="Goa, India",
        durationDays=2,
        budget=15000,
        travellers=2,
        travelStyle="relaxation",
        interests=["beaches", "food"],
        accommodationPreference="budget",
        transportPreference="rental vehicle",
        startingCity="Mumbai",
    )


def test_groq_provider_unconfigured_raises_503(sample_request):
    provider = GroqItineraryProvider(api_key="")
    with pytest.raises(AiServiceUnavailableError) as exc_info:
        # Trigger client creation
        provider._get_client()
    assert exc_info.value.status_code == 503
    assert "not configured" in exc_info.value.message


def test_groq_provider_default_model_from_config():
    provider = GroqItineraryProvider()
    assert provider.model == "openai/gpt-oss-120b"



def test_groq_provider_custom_initialization():
    provider = GroqItineraryProvider(
        api_key="gsk_test12345678901234567890",
        model="mixtral-8x7b-32768",
        timeout=45.0,
        max_retries=2,
    )
    assert provider.api_key == "gsk_test12345678901234567890"
    assert provider.model == "mixtral-8x7b-32768"
    assert provider.timeout == 45.0
    assert provider.max_retries == 2


def test_build_itinerary_prompt(sample_request):
    sys_inst, user_prompt = build_itinerary_prompt(sample_request)
    assert "JSON" in sys_inst
    assert "TripGenie AI" in sys_inst
    assert "Goa, India" in user_prompt
    assert "Mumbai" in user_prompt
    assert "INR 15000" in user_prompt
    assert "beaches, food" in user_prompt
    assert "relaxation" in user_prompt


def test_build_optimization_prompt():
    sample_itinerary = ItineraryResponse.model_validate(SAMPLE_GROQ_ITINERARY_DICT)
    sys_inst, user_prompt = build_optimization_prompt(
        itinerary=sample_itinerary,
        user_budget=5000,
        current_total=8000,
        excess_amount=3000,
        travellers=2,
        travel_style="relaxation",
        interests=["beaches"],
    )
    assert "JSON" in sys_inst
    assert "Smart Budget Optimizer" in sys_inst
    assert "INR 5000" in user_prompt
    assert "INR 8000" in user_prompt
    assert "INR 3000" in user_prompt


@pytest.mark.anyio
async def test_groq_generate_itinerary_success(sample_request):
    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=make_mock_groq_response(json.dumps(SAMPLE_GROQ_ITINERARY_DICT))
    )

    provider = GroqItineraryProvider(api_key="gsk_valid_key", client=mock_client)
    result = await provider.generate_itinerary(sample_request)

    assert isinstance(result, ItineraryResponse)
    assert result.trip.destination == "Goa, India"
    assert len(result.days) == 2
    assert result.days[0].day == 1
    assert len(result.days[0].activities) == 2
    assert result.days[1].activities[0].title == "Basilica of Bom Jesus"
    assert len(result.notes) == 2


@pytest.mark.anyio
async def test_groq_generate_itinerary_markdown_fences_stripped(sample_request):
    json_with_fences = f"```json\n{json.dumps(SAMPLE_GROQ_ITINERARY_DICT)}\n```"
    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=make_mock_groq_response(json_with_fences)
    )

    provider = GroqItineraryProvider(api_key="gsk_valid_key", client=mock_client)
    result = await provider.generate_itinerary(sample_request)
    assert result.trip.destination == "Goa, India"


@pytest.mark.anyio
async def test_groq_generate_itinerary_malformed_json_raises_502(sample_request):
    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=make_mock_groq_response('{"trip": {"destination": "Incomplete')
    )

    provider = GroqItineraryProvider(api_key="gsk_valid_key", client=mock_client, max_retries=0)
    with pytest.raises(AiServiceError) as exc_info:
        await provider.generate_itinerary(sample_request)
    assert exc_info.value.status_code == 502
    assert "malformed JSON" in exc_info.value.message


@pytest.mark.anyio
async def test_groq_generate_itinerary_schema_validation_failure_raises_502(sample_request):
    invalid_schema_dict = {
        "trip": {"destination": "Goa", "durationDays": 2},
        "days": [
            {
                "day": 1,
                "activities": [
                    {
                        "period": "invalid_period",  # Not in morning/afternoon/evening/night
                        "title": "Title",
                        "description": "Desc",
                        "category": "sightseeing",
                    }
                ],
            }
        ],
    }
    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=make_mock_groq_response(json.dumps(invalid_schema_dict))
    )

    provider = GroqItineraryProvider(api_key="gsk_valid_key", client=mock_client, max_retries=0)
    with pytest.raises(AiServiceError) as exc_info:
        await provider.generate_itinerary(sample_request)
    assert exc_info.value.status_code == 502
    assert "schema" in exc_info.value.message.lower()


@pytest.mark.anyio
async def test_groq_rate_limit_error_mapping_429(sample_request):
    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()

    request_dummy = httpx.Request("POST", "https://api.groq.com")
    response_dummy = httpx.Response(429, request=request_dummy)
    mock_client.chat.completions.create = AsyncMock(
        side_effect=groq.RateLimitError(message="Rate limit reached", response=response_dummy, body=None)
    )

    provider = GroqItineraryProvider(api_key="gsk_valid_key", client=mock_client, max_retries=0)
    with pytest.raises(AiServiceError) as exc_info:
        await provider.generate_itinerary(sample_request)
    assert exc_info.value.status_code == 429
    assert "rate limit" in exc_info.value.message.lower()


@pytest.mark.anyio
async def test_groq_timeout_error_mapping_504(sample_request):
    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()

    request_dummy = httpx.Request("POST", "https://api.groq.com")
    mock_client.chat.completions.create = AsyncMock(
        side_effect=groq.APITimeoutError(request=request_dummy)
    )

    provider = GroqItineraryProvider(api_key="gsk_valid_key", client=mock_client, max_retries=0)
    with pytest.raises(AiServiceError) as exc_info:
        await provider.generate_itinerary(sample_request)
    assert exc_info.value.status_code == 504
    assert "timed out" in exc_info.value.message.lower()


@pytest.mark.anyio
async def test_groq_auth_error_mapping_502(sample_request):
    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()

    request_dummy = httpx.Request("POST", "https://api.groq.com")
    response_dummy = httpx.Response(401, request=request_dummy)
    mock_client.chat.completions.create = AsyncMock(
        side_effect=groq.AuthenticationError(message="Invalid API Key", response=response_dummy, body=None)
    )

    provider = GroqItineraryProvider(api_key="gsk_invalid_key", client=mock_client, max_retries=0)
    with pytest.raises(AiServiceError) as exc_info:
        await provider.generate_itinerary(sample_request)
    assert exc_info.value.status_code == 502
    assert "authentication failed" in exc_info.value.message.lower()


@pytest.mark.anyio
async def test_groq_transient_retry_success(sample_request):
    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()

    request_dummy = httpx.Request("POST", "https://api.groq.com")
    # First attempt fails with timeout, second succeeds
    mock_client.chat.completions.create = AsyncMock(
        side_effect=[
            groq.APITimeoutError(request=request_dummy),
            make_mock_groq_response(json.dumps(SAMPLE_GROQ_ITINERARY_DICT)),
        ]
    )

    provider = GroqItineraryProvider(api_key="gsk_valid_key", client=mock_client, max_retries=1)
    result = await provider.generate_itinerary(sample_request)

    assert result.trip.destination == "Goa, India"
    assert mock_client.chat.completions.create.call_count == 2


@pytest.mark.anyio
async def test_groq_optimize_itinerary_success():
    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=make_mock_groq_response(json.dumps(SAMPLE_GROQ_ITINERARY_DICT))
    )

    provider = GroqItineraryProvider(api_key="gsk_valid_key", client=mock_client)
    result = await provider.optimize_itinerary(
        prompt="User optimization prompt",
        system_instruction="System prompt",
        duration_days=2,
        destination="Goa, India",
    )
    assert result.trip.destination == "Goa, India"
    assert len(result.days) == 2


@pytest.mark.anyio
async def test_itinerary_service_with_groq_provider_integration(sample_request):
    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=make_mock_groq_response(json.dumps(SAMPLE_GROQ_ITINERARY_DICT))
    )

    groq_provider = GroqItineraryProvider(api_key="gsk_valid_key", client=mock_client)
    budget_srv = BudgetService()
    itinerary_srv = ItineraryService(provider=groq_provider, budget_srv=budget_srv)

    output = await itinerary_srv.generate_itinerary(sample_request)

    assert output.trip.destination == "Goa, India"
    assert output.budget is not None
    # Verify deterministic budget calculation occurred in backend code
    assert output.budget.categoryTotals.activities == 800.0
    assert output.budget.categoryTotals.food == 1200.0
    assert output.budget.estimatedTotal == 2000.0
    assert output.budget.status in ["within_budget", "under_budget"]


@pytest.mark.anyio
async def test_budget_optimizer_service_with_groq_provider_integration():
    sample_itinerary = ItineraryResponse.model_validate(SAMPLE_GROQ_ITINERARY_DICT)

    # In sample_itinerary, total estimated cost is 2000.
    # Set user budget to 1500 to trigger over_budget optimization flow
    req = OptimizeBudgetRequest(
        itinerary=sample_itinerary,
        userBudget=1500,
        travellers=2,
        travelStyle="relaxation",
    )

    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()

    # Groq returns an itinerary with reduced costs
    cheaper_itinerary_dict = json.loads(json.dumps(SAMPLE_GROQ_ITINERARY_DICT))
    cheaper_itinerary_dict["days"][0]["activities"][0]["estimatedCost"] = 100
    cheaper_itinerary_dict["days"][0]["activities"][1]["estimatedCost"] = 50
    cheaper_itinerary_dict["days"][1]["activities"][1]["estimatedCost"] = 200

    mock_client.chat.completions.create = AsyncMock(
        return_value=make_mock_groq_response(json.dumps(cheaper_itinerary_dict))
    )

    groq_provider = GroqItineraryProvider(api_key="gsk_valid_key", client=mock_client)
    budget_srv = BudgetService()
    optimizer_srv = BudgetOptimizerService(provider=groq_provider, budget_srv=budget_srv)

    response = await optimizer_srv.optimize_budget(req)

    assert response.originalBudget.estimatedTotal == 2000.0
    assert response.originalBudget.status == "over_budget"
    assert response.optimizedBudget.estimatedTotal < response.originalBudget.estimatedTotal
    assert response.savings > 0


def test_endpoint_generate_with_mocked_groq_provider(sample_request):
    client = TestClient(app)
    mock_client = MagicMock()
    mock_client.chat = MagicMock()
    mock_client.chat.completions = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        return_value=make_mock_groq_response(json.dumps(SAMPLE_GROQ_ITINERARY_DICT))
    )

    mock_groq = GroqItineraryProvider(api_key="gsk_test", client=mock_client)

    from app.services.itinerary_service import itinerary_service
    original_provider = itinerary_service.provider
    itinerary_service.set_provider(mock_groq)

    try:
        resp = client.post(
            "/api/itineraries/generate",
            json=sample_request.model_dump(mode="json"),
        )
        assert resp.status_code == 200
        payload = resp.json()
        assert payload["success"] is True
        assert payload["message"] == "Itinerary generated successfully"
        assert payload["data"]["trip"]["destination"] == "Goa, India"
        assert "budget" in payload["data"]
        assert "x-request-id" in resp.headers
    finally:
        itinerary_service.set_provider(original_provider)
