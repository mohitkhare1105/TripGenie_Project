from fastapi import APIRouter, Depends
from supabase import Client
from app.core.auth import get_current_user
from app.core.exceptions import NotFoundException
from app.db.dependencies import get_user_db
from app.repositories.profile_repository import ProfileRepository
from app.repositories.preferences_repository import PreferencesRepository
from app.schemas.common import ApiResponse
from app.schemas.user import (
    UserContext,
    UserProfile,
    ProfileUpdate,
    UserPreferencesCreate,
    UserPreferencesResponse,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=ApiResponse[UserProfile],
    summary="Get current user profile",
)
async def get_my_profile(
    current_user: UserContext = Depends(get_current_user),
    db: Client = Depends(get_user_db),
) -> ApiResponse[UserProfile]:
    repo = ProfileRepository(db)
    profile = repo.get_by_user_id(current_user.user_id)
    if not profile:
        # Fallback to token information if profile trigger has not yet executed
        profile = UserProfile(
            id=current_user.user_id,
            email=current_user.email,
            full_name=current_user.metadata.get("full_name") or current_user.metadata.get("name"),
            avatar_url=current_user.metadata.get("avatar_url") or current_user.metadata.get("picture"),
        )
    return ApiResponse[UserProfile](
        success=True,
        message="Profile retrieved successfully",
        data=profile,
    )


@router.put(
    "/me/profile",
    response_model=ApiResponse[UserProfile],
    summary="Update current user profile",
)
async def update_my_profile(
    update_data: ProfileUpdate,
    current_user: UserContext = Depends(get_current_user),
    db: Client = Depends(get_user_db),
) -> ApiResponse[UserProfile]:
    repo = ProfileRepository(db)
    updated = repo.update(current_user.user_id, update_data)
    return ApiResponse[UserProfile](
        success=True,
        message="Profile updated successfully",
        data=updated,
    )


@router.get(
    "/me/preferences",
    response_model=ApiResponse[UserPreferencesResponse],
    summary="Get current user travel preferences",
)
async def get_my_preferences(
    current_user: UserContext = Depends(get_current_user),
    db: Client = Depends(get_user_db),
) -> ApiResponse[UserPreferencesResponse]:
    repo = PreferencesRepository(db)
    prefs = repo.get_by_user_id(current_user.user_id)
    if not prefs:
        raise NotFoundException("User travel preferences have not been set")
    return ApiResponse[UserPreferencesResponse](
        success=True,
        message="Travel preferences retrieved successfully",
        data=prefs,
    )


@router.put(
    "/me/preferences",
    response_model=ApiResponse[UserPreferencesResponse],
    summary="Upsert current user travel preferences",
)
async def update_my_preferences(
    prefs_in: UserPreferencesCreate,
    current_user: UserContext = Depends(get_current_user),
    db: Client = Depends(get_user_db),
) -> ApiResponse[UserPreferencesResponse]:
    repo = PreferencesRepository(db)
    saved = repo.upsert(current_user.user_id, prefs_in)
    return ApiResponse[UserPreferencesResponse](
        success=True,
        message="Travel preferences saved successfully",
        data=saved,
    )

