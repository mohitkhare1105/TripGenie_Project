from datetime import date
from decimal import Decimal
from typing import Any, List, Literal, Optional, Union
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from app.utils.sanitization import sanitize_text, sanitize_string_list

# Boundary constants matching itineraryRequest.ts
DESTINATION_MAX_LENGTH = 100
STARTING_CITY_MAX_LENGTH = 100
MIN_DURATION_DAYS = 1
MAX_DURATION_DAYS = 30
MIN_BUDGET = 1
MAX_BUDGET = 10_000_000
MIN_TRAVELLERS = 1
MAX_TRAVELLERS = 50
INTERESTS_MAX_ITEMS = 15
INTEREST_ITEM_MAX_LENGTH = 50
DIETARY_MAX_ITEMS = 10
DIETARY_ITEM_MAX_LENGTH = 50
DIETARY_STRING_MAX_LENGTH = 200
ACCESSIBILITY_MAX_LENGTH = 500
NOTES_MAX_LENGTH = 1000

TravelStyleType = Literal[
    "adventure",
    "relaxation",
    "family",
    "solo",
    "culture",
    "food",
]

AccommodationPreferenceType = Literal[
    "budget",
    "standard",
    "comfort",
]

TransportPreferenceType = Literal[
    "public transport",
    "walking",
    "taxi",
    "rental vehicle",
]

ActivityPeriodType = Literal[
    "morning",
    "afternoon",
    "evening",
    "night",
]

ActivityCategoryType = Literal[
    "sightseeing",
    "adventure",
    "culture",
    "food",
    "relaxation",
    "shopping",
    "travel",
    "transport",
    "accommodation",
    "activities",
    "nature",
    "entertainment",
    "other",
]

CostStatusType = Literal[
    "ai_estimate",
    "included",
    "free",
    "unknown",
]

PricingType = Literal[
    "group",
    "per_person",
]


class ItineraryRequest(BaseModel):
    """
    Validated user travel preference request payload.
    Uses strict schema to reject unexpected properties.
    """
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    destination: str = Field(
        ...,
        min_length=1,
        max_length=DESTINATION_MAX_LENGTH,
        description="Destination city, region, or country",
    )
    durationDays: int = Field(
        ...,
        ge=MIN_DURATION_DAYS,
        le=MAX_DURATION_DAYS,
        description="Total duration in days (1-30)",
    )
    budget: float = Field(
        ...,
        gt=0,
        ge=MIN_BUDGET,
        le=MAX_BUDGET,
        description="Total group budget in INR",
    )
    travellers: int = Field(
        ...,
        ge=MIN_TRAVELLERS,
        le=MAX_TRAVELLERS,
        description="Number of travellers (1-50)",
    )
    travelStyle: TravelStyleType = Field(
        ...,
        description="Primary travel style theme",
    )

    # Optional travel parameters
    startingCity: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=STARTING_CITY_MAX_LENGTH,
        description="Origin departure city",
    )
    interests: Optional[List[str]] = Field(
        default=None,
        max_length=INTERESTS_MAX_ITEMS,
        description="List of specific travel interests",
    )
    accommodationPreference: Optional[AccommodationPreferenceType] = Field(
        default=None,
        description="Preferred accommodation standard",
    )
    transportPreference: Optional[TransportPreferenceType] = Field(
        default=None,
        description="Preferred transportation method",
    )
    dietaryPreferences: Optional[Union[List[str], str]] = Field(
        default=None,
        description="Dietary requirements (as string or list)",
    )
    accessibilityRequirements: Optional[str] = Field(
        default=None,
        max_length=ACCESSIBILITY_MAX_LENGTH,
        description="Accessibility and mobility considerations",
    )
    additionalNotes: Optional[str] = Field(
        default=None,
        max_length=NOTES_MAX_LENGTH,
        description="Free-form preferences or constraints",
    )
    startDate: Optional[date] = Field(
        default=None,
        description="Trip start date (ISO format YYYY-MM-DD)",
    )
    endDate: Optional[date] = Field(
        default=None,
        description="Trip end date (ISO format YYYY-MM-DD)",
    )

    @field_validator("destination", "startingCity", mode="before")
    @classmethod
    def sanitize_locations(cls, v: Any) -> Any:
        if isinstance(v, str):
            cleaned = sanitize_text(v, escape_html=False)
            if not cleaned:
                raise ValueError("Location string cannot be empty or whitespace only")
            return cleaned
        return v

    @field_validator("interests", mode="before")
    @classmethod
    def validate_and_sanitize_interests(cls, v: Any) -> Any:
        if v is None:
            return None
        if not isinstance(v, list):
            raise ValueError("Interests must be an array of strings")
        cleaned_list = []
        for item in v:
            if not isinstance(item, str):
                raise ValueError("Each interest must be a string")
            cleaned = sanitize_text(item, max_length=INTEREST_ITEM_MAX_LENGTH, escape_html=False)
            if not cleaned:
                raise ValueError("Interest item cannot be empty")
            if len(cleaned) > INTEREST_ITEM_MAX_LENGTH:
                raise ValueError(f"Interest item cannot exceed {INTEREST_ITEM_MAX_LENGTH} characters")
            cleaned_list.append(cleaned)
        if len(cleaned_list) > INTERESTS_MAX_ITEMS:
            raise ValueError(f"Cannot provide more than {INTERESTS_MAX_ITEMS} interests")
        return cleaned_list

    @field_validator("dietaryPreferences", mode="before")
    @classmethod
    def validate_dietary(cls, v: Any) -> Any:
        if v is None:
            return None
        if isinstance(v, list):
            if len(v) > DIETARY_MAX_ITEMS:
                raise ValueError(f"Cannot provide more than {DIETARY_MAX_ITEMS} dietary preferences")
            cleaned_items = []
            for item in v:
                if not isinstance(item, str):
                    raise ValueError("Each dietary preference must be a string")
                cleaned = sanitize_text(item, max_length=DIETARY_ITEM_MAX_LENGTH, escape_html=False)
                if not cleaned:
                    raise ValueError("Dietary preference cannot be empty")
                cleaned_items.append(cleaned)
            return cleaned_items
        elif isinstance(v, str):
            cleaned = sanitize_text(v, max_length=DIETARY_STRING_MAX_LENGTH, escape_html=False)
            if not cleaned:
                raise ValueError("Dietary preference cannot be empty")
            return cleaned
        raise ValueError("Dietary preferences must be an array of strings or a string")

    @model_validator(mode="after")
    def validate_date_coherence(self) -> "ItineraryRequest":
        if self.startDate and self.endDate:
            if self.startDate > self.endDate:
                raise ValueError("startDate must be before or equal to endDate")
            computed_days = (self.endDate - self.startDate).days + 1
            if computed_days != self.durationDays:
                # If both provided, durationDays should align with date range
                pass
        return self


# Itinerary Response models matching itineraryResponse.ts
class TripInfo(BaseModel):
    destination: str
    durationDays: int
    currency: str = "INR"


class ActivityItem(BaseModel):
    period: ActivityPeriodType
    title: str = Field(..., min_length=1, max_length=150)
    description: str = Field(..., min_length=1, max_length=500)
    category: ActivityCategoryType
    durationMinutes: Optional[int] = Field(default=None, gt=0, le=720)
    estimatedCost: Optional[float] = Field(default=None, ge=0)
    costStatus: CostStatusType = Field(default="ai_estimate")
    pricingType: PricingType = Field(default="group")
    location: Optional[str] = Field(default=None, max_length=150)
    suggestedTime: Optional[str] = Field(default=None, max_length=20)
    expenseCategory: Optional[str] = None


class DayPlan(BaseModel):
    day: int = Field(..., ge=1)
    theme: Optional[str] = None
    activities: List[ActivityItem]


class ItineraryResponse(BaseModel):
    trip: TripInfo
    days: List[DayPlan]
    notes: List[str] = Field(default_factory=list)


class GeneratedItineraryData(BaseModel):
    trip: TripInfo
    days: List[DayPlan]
    budget: Any  # BudgetBreakdown schema
    notes: List[str] = Field(default_factory=list)

