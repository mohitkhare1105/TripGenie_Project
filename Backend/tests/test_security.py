from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_security_headers_present():
    """Verify that essential security headers are applied to responses."""
    response = client.get("/api/health")
    assert response.status_code == 200

    headers = response.headers
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("x-xss-protection") == "1; mode=block"
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "geolocation=()" in headers.get("permissions-policy", "")


def test_request_id_generation_and_propagation():
    """Verify that X-Request-ID is generated and returned on response."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert "x-request-id" in response.headers
    assert response.headers["x-request-id"].startswith("req_")


def test_request_id_client_preservation():
    """Verify that a client-provided X-Request-ID is preserved."""
    custom_id = "custom-trace-uuid-12345"
    response = client.get("/api/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers.get("x-request-id") == custom_id


def test_cors_headers_allowed_origin():
    """Verify CORS preflight and headers for allowed React origin."""
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_request_body_size_limit_100kb():
    """Verify that requests exceeding 100 KB (102400 bytes) are rejected with HTTP 413."""
    oversized_body = "x" * (102400 + 1)
    response = client.post(
        "/api/test-body-limit",
        content=oversized_body,
        headers={"Content-Length": str(len(oversized_body)), "Content-Type": "text/plain"},
    )
    assert response.status_code == 413
    payload = response.json()
    assert payload["success"] is False
    assert "Request body exceeds size limit" in payload["message"]

