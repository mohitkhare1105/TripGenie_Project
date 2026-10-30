import uuid
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.db.dependencies import get_user_db
from tests.helpers import generate_test_jwt, TEST_SECRET, TEST_USER_ID

client = TestClient(app, raise_server_exceptions=False)


def test_missing_auth_header_rejected():
    """Verify that requests without Authorization header are rejected with 401."""
    response = client.get("/api/users/me")
    assert response.status_code == 401
    payload = response.json()
    assert payload["success"] is False
    assert "Missing Authorization header" in payload["message"]


def test_malformed_auth_header_rejected():
    """Verify non-Bearer auth schemes are rejected with 401."""
    response = client.get("/api/users/me", headers={"Authorization": "Basic dXNlcjpwYXNz"})
    assert response.status_code == 401
    payload = response.json()
    assert payload["success"] is False
    assert "Expected 'Bearer <token>'" in payload["message"]


def test_empty_bearer_token_rejected():
    """Verify empty bearer tokens are rejected with 401."""
    response = client.get("/api/users/me", headers={"Authorization": "Bearer "})
    assert response.status_code == 401
    payload = response.json()
    assert payload["success"] is False


def test_valid_jwt_token_accepted():
    """Verify valid JWT token is accepted and injects authenticated user."""
    token = generate_test_jwt()
    mock_db = MagicMock()

    app.dependency_overrides[get_user_db] = lambda: mock_db
    try:
        with patch.object(settings, "SUPABASE_JWT_SECRET", TEST_SECRET):
            with patch("app.api.v1.endpoints.users.ProfileRepository") as mock_repo_class:
                mock_repo = MagicMock()
                mock_repo.get_by_user_id.return_value = {
                    "id": uuid.UUID(TEST_USER_ID),
                    "full_name": "Test Traveler",
                    "email": "traveler@tripgenie.ai",
                    "avatar_url": None,
                }
                mock_repo_class.return_value = mock_repo

                response = client.get(
                    "/api/users/me",
                    headers={"Authorization": f"Bearer {token}"},
                )
                assert response.status_code == 200
                payload = response.json()
                assert payload["success"] is True
                assert payload["data"]["id"] == TEST_USER_ID
                assert payload["data"]["email"] == "traveler@tripgenie.ai"
    finally:
        app.dependency_overrides.pop(get_user_db, None)


def test_expired_jwt_token_rejected():
    """Verify expired token is rejected with 401."""
    token = generate_test_jwt(exp_delta=-60)  # Expired 60s ago
    with patch.object(settings, "SUPABASE_JWT_SECRET", TEST_SECRET):
        response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401
        payload = response.json()
        assert payload["success"] is False
        assert "expired" in payload["message"].lower()


def test_invalid_signature_jwt_rejected():
    """Verify signature mismatch is rejected with 401."""
    token = generate_test_jwt(secret="wrong-secret-key-1234567890123456")
    with patch.object(settings, "SUPABASE_JWT_SECRET", TEST_SECRET):
        response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401
        payload = response.json()
        assert payload["success"] is False
        assert "signature" in payload["message"].lower()


def test_non_uuid_subject_rejected():
    """Verify tokens with non-UUID subjects are rejected."""
    token = generate_test_jwt(user_id="invalid-not-a-uuid")
    with patch.object(settings, "SUPABASE_JWT_SECRET", TEST_SECRET):
        response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401
        payload = response.json()
        assert payload["success"] is False
        assert "valid uuid" in payload["message"].lower()
