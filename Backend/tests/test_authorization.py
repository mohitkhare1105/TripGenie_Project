import uuid
from decimal import Decimal
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.db.dependencies import get_user_db
from tests.helpers import generate_test_jwt, TEST_SECRET

client = TestClient(app, raise_server_exceptions=False)

USER_A_ID = "550e8400-e29b-41d4-a716-446655440001"
USER_B_ID = "550e8400-e29b-41d4-a716-446655440002"
TRIP_ID = "660e8400-e29b-41d4-a716-446655440099"


def test_user_cannot_access_another_users_trip():
    """Verify that User A cannot retrieve a trip owned by User B."""
    token_user_a = generate_test_jwt(user_id=USER_A_ID, email="user_a@tripgenie.ai")
    mock_db = MagicMock()

    app.dependency_overrides[get_user_db] = lambda: mock_db
    try:
        with patch.object(settings, "SUPABASE_JWT_SECRET", TEST_SECRET):
            with patch("app.api.v1.endpoints.trips.TripRepository") as mock_repo_class:
                mock_repo = MagicMock()
                # Repository get_by_id checks user ownership: if User B owns it, returns None for User A
                mock_repo.get_by_id.return_value = None
                mock_repo_class.return_value = mock_repo

                response = client.get(
                    f"/api/trips/{TRIP_ID}",
                    headers={"Authorization": f"Bearer {token_user_a}"},
                )
                assert response.status_code == 404
                payload = response.json()
                assert payload["success"] is False
                assert "not found" in payload["message"].lower()

                # Verify repository was queried with the authenticated user's ID
                mock_repo.get_by_id.assert_called_once_with(uuid.UUID(TRIP_ID), uuid.UUID(USER_A_ID))
    finally:
        app.dependency_overrides.pop(get_user_db, None)


def test_client_supplied_user_id_ignored_on_creation():
    """
    Verify that if a client attempts to pass a spoofed user_id in the body,
    it is bound strictly to the authenticated user from the token.
    """
    token_user_a = generate_test_jwt(user_id=USER_A_ID)
    mock_db = MagicMock()

    trip_payload = {
        "destination": "Goa",
        "duration_days": 4,
        "budget": 25000.00,
        "currency": "INR",
        "travellers": 2,
        "travel_style": "relaxation",
        "starting_city": "Mumbai",
        "user_id": USER_B_ID,  # Spoofed user ID
    }

    app.dependency_overrides[get_user_db] = lambda: mock_db
    try:
        with patch.object(settings, "SUPABASE_JWT_SECRET", TEST_SECRET):
            with patch("app.api.v1.endpoints.trips.TripRepository") as mock_repo_class:
                mock_repo = MagicMock()
                mock_repo.create.return_value = {
                    "id": uuid.UUID(TRIP_ID),
                    "user_id": uuid.UUID(USER_A_ID),  # Bound to User A
                    "destination": "Goa",
                    "duration_days": 4,
                    "budget": Decimal("25000.00"),
                    "currency": "INR",
                    "travellers": 2,
                    "travel_style": "relaxation",
                    "starting_city": "Mumbai",
                    "travel_preferences": {},
                    "itinerary_data": {},
                    "status": "draft",
                }
                mock_repo_class.return_value = mock_repo

                response = client.post(
                    "/api/trips",
                    json=trip_payload,
                    headers={"Authorization": f"Bearer {token_user_a}"},
                )
                assert response.status_code == 200

                # Verify that create was invoked with User A (from token), NOT the spoofed User B
                args, _ = mock_repo.create.call_args
                assert args[0] == uuid.UUID(USER_A_ID)
    finally:
        app.dependency_overrides.pop(get_user_db, None)
