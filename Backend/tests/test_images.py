from unittest.mock import AsyncMock, MagicMock
import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.image import DestinationImagesResponse
from app.services.unsplash_service import UnsplashService


@pytest.fixture
def test_client():
    return TestClient(app)


@pytest.mark.anyio
async def test_unsplash_service_unconfigured_fallback():
    service = UnsplashService(access_key=None)
    response = await service.get_destination_images("Manali, India", count=3)

    assert isinstance(response, DestinationImagesResponse)
    assert response.query == "Manali, India"
    assert len(response.images) == 3
    assert response.primary_image is not None
    assert "Manali, India" in response.primary_image.alt_description
    assert response.primary_image.url.startswith("https://images.unsplash.com")


@pytest.mark.anyio
async def test_unsplash_service_success_mocked():
    mock_payload = {
        "results": [
            {
                "id": "photo-123",
                "urls": {
                    "regular": "https://images.unsplash.com/regular-photo",
                    "thumb": "https://images.unsplash.com/thumb-photo",
                },
                "alt_description": "Beautiful sunrise over Jaipur",
                "user": {
                    "name": "Jane Photographer",
                    "links": {"html": "https://unsplash.com/@jane"},
                },
                "links": {
                    "html": "https://unsplash.com/photos/photo-123",
                },
            }
        ]
    }

    mock_http_client = MagicMock()
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json = MagicMock(return_value=mock_payload)
    mock_http_client.get = AsyncMock(return_value=mock_response)

    service = UnsplashService(access_key="fake_key", http_client=mock_http_client)
    response = await service.get_destination_images("Jaipur", count=1)

    assert response.query == "Jaipur"
    assert len(response.images) == 1
    assert response.images[0].id == "photo-123"
    assert response.images[0].photographer_name == "Jane Photographer"
    assert response.primary_image.url == "https://images.unsplash.com/regular-photo"


@pytest.mark.anyio
async def test_unsplash_service_error_uses_fallback():
    mock_http_client = MagicMock()
    mock_response = MagicMock()
    mock_response.status_code = 403
    mock_http_client.get = AsyncMock(return_value=mock_response)

    service = UnsplashService(access_key="rate_limited_key", http_client=mock_http_client)
    response = await service.get_destination_images("Goa", count=2)

    assert len(response.images) == 2
    assert response.primary_image is not None
    assert response.primary_image.url.startswith("https://images.unsplash.com")


def test_get_destination_images_endpoint(test_client):
    response = test_client.get("/api/images/destination?query=Shimla&count=2")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["query"] == "Shimla"
    assert len(payload["data"]["images"]) == 2
    assert payload["data"]["primary_image"] is not None

