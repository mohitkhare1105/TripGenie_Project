import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_health_endpoint():
    """Verify that GET /api/health satisfies all Phase 1 contract requirements."""
    response = client.get("/api/health")
    assert response.status_code == 200

    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "TripGenie AI backend is running"
    assert "data" in payload

    data = payload["data"]
    assert data["status"] == "healthy"
    assert isinstance(data["uptime"], int)
    assert data["uptime"] >= 0
    assert "timestamp" in data

    # Verify UTC timestamp parses cleanly as ISO 8601
    parsed_time = datetime.fromisoformat(data["timestamp"])
    assert parsed_time is not None


def test_root_health_alias():
    """Verify that GET /health functions identically for top-level health probes."""
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["status"] == "healthy"


def test_root_endpoint():
    """Verify that GET / returns API information."""
    response = client.get("/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert "TripGenie AI Backend API is active" in payload["message"]

