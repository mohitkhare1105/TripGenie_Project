from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class TripBase(BaseModel):
    """
    Base attributes for a saved trip.
    """
    destination: str = Field(..., min_length=1, max_length=100, description="Trip destination name")
    duration_days: int = Field(..., ge=1, le=30, description="Total days for the trip")
    budget: Decimal = Field(..., gt=0, decimal_places=2, description="Total budget in currency")
    currency: str = Field(default="INR", max_length=10, description="Currency code (e.g. INR)")
    travellers: int = Field(..., ge=1, le=50, description="Number of travellers")
    travel_style: str = Field(..., max_length=50, description="Travel style")
    starting_city: Optional[str] = Field(default=None, max_length=100, description="Origin city")
    travel_preferences: Dict[str, Any] = Field(
        default_factory=dict,
        description="Structured optional preferences (interests, diet, transport, etc.)"
    )
    itinerary_data: Dict[str, Any] = Field(
        default_factory=dict,
        description="Structured day-wise itinerary activities and calculated expenses"
    )
    status: str = Field(
        default="draft",
        pattern="^(draft|planned|completed|archived)$",
        description="Trip status lifecycle"
    )


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    destination: Optional[str] = Field(default=None, min_length=1, max_length=100)
    duration_days: Optional[int] = Field(default=None, ge=1, le=30)
    budget: Optional[Decimal] = Field(default=None, gt=0, decimal_places=2)
    currency: Optional[str] = Field(default=None, max_length=10)
    travellers: Optional[int] = Field(default=None, ge=1, le=50)
    travel_style: Optional[str] = Field(default=None, max_length=50)
    starting_city: Optional[str] = Field(default=None, max_length=100)
    travel_preferences: Optional[Dict[str, Any]] = None
    itinerary_data: Optional[Dict[str, Any]] = None
    status: Optional[str] = Field(default=None, pattern="^(draft|planned|completed|archived)$")


class TripResponse(TripBase):
    id: UUID
    user_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TripListResponse(BaseModel):
    items: List[TripResponse]
    total: int

