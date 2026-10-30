import logging
from typing import List, Optional
import httpx

from app.config import settings
from app.core.logging import setup_logger
from app.schemas.image import DestinationImage, DestinationImagesResponse

logger = setup_logger("unsplash_service")

# Curated fallback destination photography from Unsplash CDN for reliable offline/development experience
FALLBACK_IMAGES: List[DestinationImage] = [
    DestinationImage(
        id="fallback-1",
        url="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
        thumb_url="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=300&q=80",
        alt_description="Scenic mountain highway journey",
        photographer_name="Luca Bravo",
        photographer_url="https://unsplash.com/@lucabravo",
        unsplash_url="https://unsplash.com/photos/O453M2Liufs",
    ),
    DestinationImage(
        id="fallback-2",
        url="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80",
        thumb_url="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=300&q=80",
        alt_description="Historic palace architecture and travel destination",
        photographer_name="Sylwia Bartyzel",
        photographer_url="https://unsplash.com/@sylviagb",
        unsplash_url="https://unsplash.com/photos/eWqOgJICvyR",
    ),
    DestinationImage(
        id="fallback-3",
        url="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        thumb_url="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80",
        alt_description="Tropical beach coast and sunset waters",
        photographer_name="Sean Oulashin",
        photographer_url="https://unsplash.com/@oulashin",
        unsplash_url="https://unsplash.com/photos/KMn4VEeEPR8",
    ),
    DestinationImage(
        id="fallback-4",
        url="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
        thumb_url="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=300&q=80",
        alt_description="Alpine lake exploration in nature",
        photographer_name="Kalvis Alberts",
        photographer_url="https://unsplash.com/@kalvis",
        unsplash_url="https://unsplash.com/photos/4f4KnTr35-A",
    ),
]


class UnsplashService:
    """
    Service for fetching destination photography via Unsplash API with graceful fallback.
    """

    def __init__(
        self,
        access_key: Optional[str] = None,
        timeout: Optional[float] = None,
        http_client: Optional[httpx.AsyncClient] = None,
    ):
        self.access_key = access_key if access_key is not None else settings.UNSPLASH_ACCESS_KEY
        self.timeout = timeout if timeout is not None else settings.UNSPLASH_TIMEOUT
        self._http_client = http_client

    def _get_fallbacks(self, query: str, count: int) -> List[DestinationImage]:
        """Provides curated fallback images with query-relevant alt descriptions."""
        images = []
        for i, fallback in enumerate(FALLBACK_IMAGES[:count]):
            img = fallback.model_copy()
            img.alt_description = f"{query} destination view ({i+1})"
            images.append(img)
        return images

    async def get_destination_images(
        self,
        destination: str,
        count: int = 4,
    ) -> DestinationImagesResponse:
        """
        Retrieves high-quality destination images for cards and banners.
        """
        cleaned_dest = destination.strip()
        count = min(max(1, count), 10)

        # If Unsplash is not configured, return curated fallbacks immediately
        if not self.access_key or not self.access_key.strip():
            logger.info("Unsplash access key not configured. Using curated destination fallbacks for '%s'.", cleaned_dest)
            fallbacks = self._get_fallbacks(cleaned_dest, count)
            return DestinationImagesResponse(
                query=cleaned_dest,
                images=fallbacks,
                primary_image=fallbacks[0] if fallbacks else None,
            )

        try:
            url = "https://api.unsplash.com/search/photos"
            params = {
                "query": f"{cleaned_dest} travel landmark",
                "per_page": count,
                "orientation": "landscape",
            }
            headers = {
                "Authorization": f"Client-ID {self.access_key.strip()}",
                "Accept-Version": "v1",
            }

            if self._http_client:
                response = await self._http_client.get(
                    url, params=params, headers=headers, timeout=self.timeout
                )
            else:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(url, params=params, headers=headers)

            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                if results:
                    images: List[DestinationImage] = []
                    for item in results:
                        urls = item.get("urls", {})
                        user = item.get("user", {})
                        links = item.get("links", {})
                        user_links = user.get("links", {})

                        images.append(
                            DestinationImage(
                                id=item.get("id", ""),
                                url=urls.get("regular") or urls.get("full") or urls.get("small", ""),
                                thumb_url=urls.get("thumb") or urls.get("small", ""),
                                alt_description=item.get("alt_description") or item.get("description") or f"View of {cleaned_dest}",
                                photographer_name=user.get("name"),
                                photographer_url=user_links.get("html"),
                                unsplash_url=links.get("html"),
                            )
                        )

                    logger.info("Retrieved %d images for destination '%s' from Unsplash.", len(images), cleaned_dest)
                    return DestinationImagesResponse(
                        query=cleaned_dest,
                        images=images,
                        primary_image=images[0] if images else None,
                    )

            logger.warning(
                "Unsplash API returned HTTP %d for query '%s'. Falling back to curated images.",
                response.status_code,
                cleaned_dest,
            )

        except Exception as err:
            logger.warning("Unsplash request failed for '%s': %s. Using fallback.", cleaned_dest, str(err))

        fallbacks = self._get_fallbacks(cleaned_dest, count)
        return DestinationImagesResponse(
            query=cleaned_dest,
            images=fallbacks,
            primary_image=fallbacks[0] if fallbacks else None,
        )


unsplash_service = UnsplashService()

