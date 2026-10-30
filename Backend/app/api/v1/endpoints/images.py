from fastapi import APIRouter, Depends, Query
from app.core.auth import get_optional_user
from app.schemas.common import ApiResponse
from app.schemas.image import DestinationImagesResponse
from app.schemas.user import UserContext
from app.services.unsplash_service import unsplash_service

router = APIRouter(prefix="/images", tags=["Images"])


@router.get(
    "/destination",
    response_model=ApiResponse[DestinationImagesResponse],
    summary="Get destination images",
    description="Retrieves landscape destination photography via Unsplash API with automatic fallback.",
)
async def get_destination_images(
    query: str = Query(..., min_length=1, max_length=100, description="Destination name or region"),
    count: int = Query(default=4, ge=1, le=10, description="Number of images to retrieve (1-10)"),
    optional_user: UserContext = Depends(get_optional_user),
) -> ApiResponse[DestinationImagesResponse]:
    result = await unsplash_service.get_destination_images(destination=query, count=count)
    return ApiResponse[DestinationImagesResponse](
        success=True,
        message="Destination images retrieved successfully",
        data=result,
    )

