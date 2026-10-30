from typing import Optional
from uuid import UUID
from supabase import Client
from app.core.exceptions import DatabaseOperationError, NotFoundException
from app.core.logging import logger
from app.schemas.user import UserPreferencesCreate, UserPreferencesResponse


class PreferencesRepository:
    def __init__(self, client: Client):
        self.client = client

    def get_by_user_id(self, user_id: UUID) -> Optional[UserPreferencesResponse]:
        """
        Retrieves user preferences by user UUID.
        """
        try:
            response = (
                self.client.table("user_preferences")
                .select("*")
                .eq("user_id", str(user_id))
                .maybe_single()
                .execute()
            )
            data = getattr(response, "data", None)
            if not data:
                return None
            return UserPreferencesResponse(**data)
        except Exception as e:
            logger.error(f"Error fetching preferences for user {user_id}: {str(e)}")
            raise DatabaseOperationError(f"Failed to retrieve preferences: {str(e)}")

    def upsert(self, user_id: UUID, prefs: UserPreferencesCreate) -> UserPreferencesResponse:
        """
        Inserts or updates preferences for the authenticated user.
        """
        payload = prefs.model_dump(mode="json")
        payload["user_id"] = str(user_id)

        try:
            response = (
                self.client.table("user_preferences")
                .upsert(payload, on_conflict="user_id")
                .execute()
            )
            data = getattr(response, "data", [])
            if not data:
                raise DatabaseOperationError("Failed to persist user preferences")
            return UserPreferencesResponse(**data[0])
        except Exception as e:
            logger.error(f"Error upserting preferences for user {user_id}: {str(e)}")
            raise DatabaseOperationError(f"Failed to save preferences: {str(e)}")

