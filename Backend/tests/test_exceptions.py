from fastapi import APIRouter
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field
from app.main import app

# Helper test model for validation error testing
class SamplePayload(BaseModel):
    name: str = Field(..., min_length=2)
    count: int = Field(..., ge=1)

# Dynamically add test endpoints for exception behavior verification
internal_router = APIRouter(prefix="/test-internal", tags=["Testing"])

@internal_router.post("/validate")
async def handle_validation_test(payload: SamplePayload):
    return {"success": True, "data": payload.model_dump()}

@internal_router.get("/crash")
async def handle_crash_test():
    raise RuntimeError("Simulated unexpected failure")

app.include_router(internal_router)

# Use raise_server_exceptions=False to test unhandled server exception response handling
client = TestClient(app, raise_server_exceptions=False)


def test_404_not_found_standard_envelope():
    """Verify that 404 responses follow the standardized error schema."""
    response = client.get("/api/non-existent-endpoint")
    assert response.status_code == 404
    payload = response.json()
    assert payload["success"] is False
    assert "Not Found" in payload["message"]
    assert payload["data"] is None


def test_validation_error_handling():
    """Verify that validation errors return HTTP 400 with structured errors array."""
    response = client.post("/test-internal/validate", json={"name": "", "count": 0})
    assert response.status_code == 400
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "Validation failed"
    assert isinstance(payload["errors"], list)
    assert len(payload["errors"]) >= 1


def test_unhandled_exception_handling():
    """Verify that uncaught exceptions return HTTP 500 in standardized format."""
    response = client.get("/test-internal/crash")
    assert response.status_code == 500
    payload = response.json()
    assert payload["success"] is False
    assert "Internal server error" in payload["message"]