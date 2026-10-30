import pytest
from pydantic import ValidationError
from app.schemas.itinerary import ItineraryRequest


def get_valid_payload():
    return {
        "destination": "Manali",
        "durationDays": 4,
        "budget": 25000.0,
        "travellers": 2,
        "travelStyle": "adventure",
        "startingCity": "Delhi",
        "interests": ["trekking", "nature"],
        "accommodationPreference": "budget",
        "transportPreference": "public transport",
        "dietaryPreferences": ["vegetarian"],
    }


def test_valid_request_payload():
    """Verify minimal and comprehensive valid payloads pass validation."""
    data = get_valid_payload()
    req = ItineraryRequest(**data)
    assert req.destination == "Manali"
    assert req.durationDays == 4
    assert req.budget == 25000.0
    assert req.travellers == 2
    assert req.travelStyle == "adventure"


def test_missing_required_destination():
    """Verify missing destination is rejected."""
    data = get_valid_payload()
    del data["destination"]
    with pytest.raises(ValidationError) as exc:
        ItineraryRequest(**data)
    assert "destination" in str(exc.value)


def test_empty_destination():
    """Verify empty or whitespace-only destination is rejected."""
    data = get_valid_payload()
    data["destination"] = "   "
    with pytest.raises(ValidationError) as exc:
        ItineraryRequest(**data)
    assert "destination" in str(exc.value).lower()


def test_destination_exceeds_max_length():
    """Verify destination exceeding 100 characters is rejected."""
    data = get_valid_payload()
    data["destination"] = "A" * 101
    with pytest.raises(ValidationError):
        ItineraryRequest(**data)


def test_duration_boundary_limits():
    """Verify duration days below 1 or above 30 are rejected."""
    data = get_valid_payload()
    data["durationDays"] = 0
    with pytest.raises(ValidationError):
        ItineraryRequest(**data)

    data["durationDays"] = 31
    with pytest.raises(ValidationError):
        ItineraryRequest(**data)


def test_budget_boundary_limits():
    """Verify budget must be positive and within 10,000,000."""
    data = get_valid_payload()
    data["budget"] = 0
    with pytest.raises(ValidationError):
        ItineraryRequest(**data)

    data["budget"] = -500
    with pytest.raises(ValidationError):
        ItineraryRequest(**data)

    data["budget"] = 10_000_001
    with pytest.raises(ValidationError):
        ItineraryRequest(**data)


def test_travellers_boundary_limits():
    """Verify travellers must be between 1 and 50."""
    data = get_valid_payload()
    data["travellers"] = 0
    with pytest.raises(ValidationError):
        ItineraryRequest(**data)

    data["travellers"] = 51
    with pytest.raises(ValidationError):
        ItineraryRequest(**data)


def test_invalid_travel_style():
    """Verify unsupported travel style is rejected."""
    data = get_valid_payload()
    data["travelStyle"] = "luxury-party"
    with pytest.raises(ValidationError):
        ItineraryRequest(**data)


def test_too_many_interests():
    """Verify interests array cannot exceed 15 items."""
    data = get_valid_payload()
    data["interests"] = [f"Interest {i}" for i in range(16)]
    with pytest.raises(ValidationError):
        ItineraryRequest(**data)


def test_date_coherence_start_after_end():
    """Verify startDate cannot be after endDate."""
    data = get_valid_payload()
    data["startDate"] = "2026-12-10"
    data["endDate"] = "2026-12-05"
    with pytest.raises(ValidationError) as exc:
        ItineraryRequest(**data)
    assert "startdate" in str(exc.value).lower()


def test_unexpected_fields_rejected():
    """Verify unexpected fields are rejected under strict schema."""
    data = get_valid_payload()
    data["duration_days"] = 4  # Misspelled snake_case
    with pytest.raises(ValidationError) as exc:
        ItineraryRequest(**data)
    assert "extra_forbidden" in str(exc.value) or "duration_days" in str(exc.value)

