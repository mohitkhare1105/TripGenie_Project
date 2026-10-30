from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.core.exceptions import DatabaseConfigurationError
from app.db.supabase import get_supabase_client, get_supabase_service_client, check_database_connection

client = TestClient(app, raise_server_exceptions=False)


def test_missing_credentials_raises_configuration_error():
    """Verify get_supabase_client raises DatabaseConfigurationError when unconfigured."""
    with patch.object(settings, "SUPABASE_URL", None):
        with patch.object(settings, "SUPABASE_ANON_KEY", None):
            with pytest.raises(DatabaseConfigurationError) as exc:
                get_supabase_client()
            assert "not configured" in str(exc.value)


def test_missing_service_key_raises_configuration_error():
    """Verify get_supabase_service_client raises DatabaseConfigurationError when unconfigured."""
    with patch.object(settings, "SUPABASE_SERVICE_ROLE_KEY", None):
        with pytest.raises(DatabaseConfigurationError) as exc:
            get_supabase_service_client()
        assert "service role" in str(exc.value)


def test_check_database_connection_unconfigured():
    """Verify check_database_connection returns safe unconfigured status without leaking info."""
    with patch.object(settings, "SUPABASE_URL", None):
        result = check_database_connection()
        assert result["healthy"] is False
        assert result["status"] == "unconfigured"
        assert "password" not in str(result)
        assert "secret" not in str(result)


def test_database_health_endpoint_when_unconfigured():
    """Verify GET /api/health/database returns HTTP 503 when database is unconfigured."""
    with patch.object(settings, "SUPABASE_URL", None):
        response = client.get("/api/health/database")
        assert response.status_code == 503
        payload = response.json()
        assert payload["success"] is False
        assert payload["data"]["healthy"] is False


def test_database_health_endpoint_when_connected():
    """Verify GET /api/health/database returns HTTP 200 when database probe succeeds."""
    with patch("app.api.v1.endpoints.health.check_database_connection") as mock_probe:
        mock_probe.return_value = {
            "status": "connected",
            "message": "Database connection verified",
            "healthy": True,
            "latency_ms": 12.5,
        }
        response = client.get("/api/health/database")
        assert response.status_code == 200
        payload = response.json()
        assert payload["success"] is True
        assert payload["data"]["status"] == "connected"
        assert payload["data"]["latency_ms"] == 12.5


def test_basic_health_endpoint_unaffected_by_database_state():
    """Verify GET /api/health remains HTTP 200 even when database is unconfigured."""
    with patch.object(settings, "SUPABASE_URL", None):
        response = client.get("/api/health")
        assert response.status_code == 200
        payload = response.json()
        assert payload["success"] is True
        assert payload["data"]["status"] == "healthy"

