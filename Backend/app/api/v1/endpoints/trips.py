from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from supabase import Client
from app.core.auth import get_current_user
from app.core.exceptions import NotFoundException
from app.db.dependencies import get_user_db
from app.repositories.trip_repository import TripRepository
from app.schemas.common import ApiResponse
from app.schemas.trip import TripCreate, TripUpdate, TripResponse, TripListResponse
from app.schemas.user import UserContext

router = APIRouter(prefix="/trips", tags=["Trips"])


@router.get(
    "",
    response_model=ApiResponse[TripListResponse],
    summary="List saved trips for authenticated user",
)
async def list_trips(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: UserContext = Depends(get_current_user),
    db: Client = Depends(get_user_db),
) -> ApiResponse[TripListResponse]:
    repo = TripRepository(db)
    result = repo.list_by_user(current_user.user_id, limit=limit, offset=offset)
    return ApiResponse[TripListResponse](
        success=True,
        message="Trips retrieved successfully",
        data=result,
    )


@router.post(
    "",
    response_model=ApiResponse[TripResponse],
    summary="Save a new trip itinerary",
)
async def create_trip(
    trip_in: TripCreate,
    current_user: UserContext = Depends(get_current_user),
    db: Client = Depends(get_user_db),
) -> ApiResponse[TripResponse]:
    repo = TripRepository(db)
    # Strictly bind ownership to verified current_user.user_id
    created = repo.create(current_user.user_id, trip_in)
    return ApiResponse[TripResponse](
        success=True,
        message="Trip saved successfully",
        data=created,
    )


@router.get(
    "/{trip_id}",
    response_model=ApiResponse[TripResponse],
    summary="Get saved trip details by ID",
)
async def get_trip(
    trip_id: UUID,
    current_user: UserContext = Depends(get_current_user),
    db: Client = Depends(get_user_db),
) -> ApiResponse[TripResponse]:
    repo = TripRepository(db)
    trip = repo.get_by_id(trip_id, current_user.user_id)
    if not trip:
        raise NotFoundException(f"Trip with id '{trip_id}' not found")
    return ApiResponse[TripResponse](
        success=True,
        message="Trip retrieved successfully",
        data=trip,
    )


@router.put(
    "/{trip_id}",
    response_model=ApiResponse[TripResponse],
    summary="Update saved trip",
)
async def update_trip(
    trip_id: UUID,
    trip_update: TripUpdate,
    current_user: UserContext = Depends(get_current_user),
    db: Client = Depends(get_user_db),
) -> ApiResponse[TripResponse]:
    repo = TripRepository(db)
    updated = repo.update(trip_id, current_user.user_id, trip_update)
    return ApiResponse[TripResponse](
        success=True,
        message="Trip updated successfully",
        data=updated,
    )


@router.delete(
    "/{trip_id}",
    response_model=ApiResponse[dict],
    summary="Delete saved trip",
)
async def delete_trip(
    trip_id: UUID,
    current_user: UserContext = Depends(get_current_user),
    db: Client = Depends(get_user_db),
) -> ApiResponse[dict]:
    repo = TripRepository(db)
    repo.delete(trip_id, current_user.user_id)
    return ApiResponse[dict](
        success=True,
        message="Trip deleted successfully",
        data={"deleted": True, "trip_id": str(trip_id)},
    )

