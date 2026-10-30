from typing import Optional
from uuid import UUID
from supabase import Client
from app.core.exceptions import DatabaseOperationError, NotFoundException
from app.core.logging import logger
from app.schemas.user import UserProfile, ProfileUpdate


class ProfileRepository:
    def __init__(self, client: Client):
        self.client = client

    def get_by_user_id(self, user_id: UUID) -> Optional[UserProfile]:
        """
        Retrieves a user profile by UUID.
        """
        try:
            response = (
                self.client.table("profiles")
                .select("*")
                .eq("id", str(user_id))
                .maybe_single()
                .execute()
            )
            data = getattr(response, "data", None)
            if not data:
                return None
            return UserProfile(**data)
        except Exception as e:
            logger.error(f"Error fetching profile for user {user_id}: {str(e)}")
            raise DatabaseOperationError(f"Failed to fetch profile: {str(e)}")

    def update(self, user_id: UUID, update_data: ProfileUpdate) -> UserProfile:
        """
        Updates profile fields for the authenticated user.
        """
        payload = {k: v for k, v in update_data.model_dump().items() if v is not None}
        if not payload:
            existing = self.get_by_user_id(user_id)
            if not existing:
                raise NotFoundException("User profile not found")
            return existing

        try:
            response = (
                self.client.table("profiles")
                .update(payload)
                .eq("id", str(user_id))
                .execute()
            )
            data = getattr(response, "data", [])
            if not data:
                raise NotFoundException("User profile not found or update not permitted")
            return UserProfile(**data[0])
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error updating profile for user {user_id}: {str(e)}")
            raise DatabaseOperationError(f"Failed to update profile: {str(e)}")

