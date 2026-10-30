from typing import List, Optional
from uuid import UUID
from supabase import Client
from app.core.exceptions import DatabaseOperationError, NotFoundException
from app.core.logging import logger
from app.schemas.trip import TripCreate, TripUpdate, TripResponse, TripListResponse


class TripRepository:
    def __init__(self, client: Client):
        self.client = client

    def list_by_user(self, user_id: UUID, limit: int = 50, offset: int = 0) -> TripListResponse:
        """
        Lists trips belonging to the authenticated user.
        """
        try:
            query = (
                self.client.table("trips")
                .select("*", count="exact")
                .eq("user_id", str(user_id))
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
            )
            response = query.execute()
            data = getattr(response, "data", []) or []
            total = getattr(response, "count", len(data)) or len(data)

            items = [TripResponse(**item) for item in data]
            return TripListResponse(items=items, total=total)
        except Exception as e:
            logger.error(f"Error listing trips for user {user_id}: {str(e)}")
            raise DatabaseOperationError(f"Failed to retrieve trips: {str(e)}")

    def get_by_id(self, trip_id: UUID, user_id: UUID) -> Optional[TripResponse]:
        """
        Retrieves a single trip verifying ownership.
        """
        try:
            response = (
                self.client.table("trips")
                .select("*")
                .eq("id", str(trip_id))
                .eq("user_id", str(user_id))
                .maybe_single()
                .execute()
            )
            data = getattr(response, "data", None)
            if not data:
                return None
            return TripResponse(**data)
        except Exception as e:
            logger.error(f"Error fetching trip {trip_id} for user {user_id}: {str(e)}")
            raise DatabaseOperationError(f"Failed to retrieve trip: {str(e)}")

    def create(self, user_id: UUID, trip: TripCreate) -> TripResponse:
        """
        Creates a new trip record for the authenticated user.
        Enforces user_id ownership from verified context.
        """
        payload = trip.model_dump(mode="json")
        payload["user_id"] = str(user_id)
        if "budget" in payload and payload["budget"] is not None:
            payload["budget"] = float(payload["budget"])

        try:
            response = (
                self.client.table("trips")
                .insert(payload)
                .execute()
            )
            data = getattr(response, "data", [])
            if not data:
                raise DatabaseOperationError("Failed to persist trip: no data returned from database")
            return TripResponse(**data[0])
        except Exception as e:
            logger.error(f"Error creating trip for user {user_id}: {str(e)}")
            raise DatabaseOperationError(f"Failed to create trip: {str(e)}")

    def update(self, trip_id: UUID, user_id: UUID, update_data: TripUpdate) -> TripResponse:
        """
        Updates an existing trip belonging to the user.
        """
        payload = {k: v for k, v in update_data.model_dump(mode="json").items() if v is not None}
        if "budget" in payload and payload["budget"] is not None:
            payload["budget"] = float(payload["budget"])

        if not payload:
            existing = self.get_by_id(trip_id, user_id)
            if not existing:
                raise NotFoundException(f"Trip with id '{trip_id}' not found")
            return existing

        try:
            response = (
                self.client.table("trips")
                .update(payload)
                .eq("id", str(trip_id))
                .eq("user_id", str(user_id))
                .execute()
            )
            data = getattr(response, "data", [])
            if not data:
                raise NotFoundException(f"Trip with id '{trip_id}' not found or update not permitted")
            return TripResponse(**data[0])
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error updating trip {trip_id} for user {user_id}: {str(e)}")
            raise DatabaseOperationError(f"Failed to update trip: {str(e)}")

    def delete(self, trip_id: UUID, user_id: UUID) -> bool:
        """
        Deletes a trip belonging to the user.
        """
        try:
            response = (
                self.client.table("trips")
                .delete()
                .eq("id", str(trip_id))
                .eq("user_id", str(user_id))
                .execute()
            )
            data = getattr(response, "data", [])
            if not data:
                # Check if it existed
                existing = self.get_by_id(trip_id, user_id)
                if not existing:
                    raise NotFoundException(f"Trip with id '{trip_id}' not found")
            return True
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error deleting trip {trip_id} for user {user_id}: {str(e)}")
            raise DatabaseOperationError(f"Failed to delete trip: {str(e)}")

