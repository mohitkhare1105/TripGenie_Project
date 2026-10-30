import uuid
from decimal import Decimal
from unittest.mock import MagicMock
import pytest
from app.core.exceptions import DatabaseOperationError, NotFoundException
from app.repositories.profile_repository import ProfileRepository
from app.repositories.trip_repository import TripRepository
from app.repositories.preferences_repository import PreferencesRepository
from app.schemas.user import ProfileUpdate, UserPreferencesCreate
from app.schemas.trip import TripCreate, TripUpdate

USER_ID = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")
TRIP_ID = uuid.UUID("660e8400-e29b-41d4-a716-446655440001")


def test_profile_repository_get_success():
    """Verify ProfileRepository fetches profile successfully."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.data = {
        "id": str(USER_ID),
        "full_name": "Test User",
        "email": "test@tripgenie.ai",
        "avatar_url": None,
    }
    mock_client.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_response

    repo = ProfileRepository(mock_client)
    profile = repo.get_by_user_id(USER_ID)
    assert profile is not None
    assert profile.id == USER_ID
    assert profile.full_name == "Test User"


def test_profile_repository_get_not_found():
    """Verify ProfileRepository returns None when profile does not exist."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.data = None
    mock_client.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_response

    repo = ProfileRepository(mock_client)
    profile = repo.get_by_user_id(USER_ID)
    assert profile is None


def test_trip_repository_create():
    """Verify TripRepository persists trip data."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.data = [{
        "id": str(TRIP_ID),
        "user_id": str(USER_ID),
        "destination": "Shimla",
        "duration_days": 3,
        "budget": 18000.0,
        "currency": "INR",
        "travellers": 2,
        "travel_style": "relaxation",
        "starting_city": "Delhi",
        "travel_preferences": {},
        "itinerary_data": {},
        "status": "draft",
    }]
    mock_client.table.return_value.insert.return_value.execute.return_value = mock_response

    repo = TripRepository(mock_client)
    trip_in = TripCreate(
        destination="Shimla",
        duration_days=3,
        budget=Decimal("18000.00"),
        currency="INR",
        travellers=2,
        travel_style="relaxation",
        starting_city="Delhi",
    )
    saved = repo.create(USER_ID, trip_in)
    assert saved.id == TRIP_ID
    assert saved.destination == "Shimla"


def test_preferences_repository_upsert():
    """Verify PreferencesRepository saves user preferences."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.data = [{
        "id": str(uuid.uuid4()),
        "user_id": str(USER_ID),
        "travel_style": "adventure",
        "interests": ["trekking", "nature"],
        "accommodation_preference": "budget",
        "transport_preference": "public transport",
        "dietary_preferences": "vegetarian",
    }]
    mock_client.table.return_value.upsert.return_value.execute.return_value = mock_response

    repo = PreferencesRepository(mock_client)
    prefs_in = UserPreferencesCreate(
        travel_style="adventure",
        interests=["trekking", "nature"],
        accommodation_preference="budget",
        transport_preference="public transport",
        dietary_preferences="vegetarian",
    )
    result = repo.upsert(USER_ID, prefs_in)
    assert result.user_id == USER_ID
    assert result.travel_style == "adventure"
    assert "trekking" in result.interests

