import asyncio
import time
from fastapi.testclient import TestClient
from app.main import app
from app.services.itinerary_service import itinerary_service
from app.services.ai.itinerary_provider import ItineraryProvider
from app.schemas.itinerary import ItineraryRequest, ItineraryResponse
from app.middleware.duplicate_request import (
    DuplicateRequestGuard,
    generate_request_fingerprint,
    ConcurrentDuplicateError,
    clear_in_flight_locks,
)
from tests.test_itinerary_endpoints import get_mock_itinerary_response

client = TestClient(app, raise_server_exceptions=False)


def test_concurrent_duplicate_request_guard():
    """Verify DuplicateRequestGuard prevents identical concurrent operations."""
    clear_in_flight_locks()
    fp = generate_request_fingerprint({"destination": "Goa", "budget": 10000})

    with DuplicateRequestGuard(fp):
        # Attempting duplicate while first is in-flight must raise ConcurrentDuplicateError (HTTP 429)
        try:
            with DuplicateRequestGuard(fp):
                assert False, "Should have raised ConcurrentDuplicateError"
        except ConcurrentDuplicateError as exc:
            assert exc.status_code == 429

    # After exiting block, lock must be released
    with DuplicateRequestGuard(fp):
        pass  # Success, lock was freed


def test_request_id_attached_to_itinerary_response():
    """Verify X-Request-ID header is present on itinerary generation responses."""
    payload = {
        "destination": "Goa",
        "durationDays": 2,
        "budget": 15000.0,
        "travellers": 2,
        "travelStyle": "relaxation",
    }
    response = client.post("/api/itineraries/generate", json=payload)
    assert "x-request-id" in response.headers
    assert response.headers["x-request-id"].startswith("req_")
