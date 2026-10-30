from typing import Any, List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.itinerary import ItineraryResponse

BudgetCategoryType = Literal[
    "transport",
    "accommodation",
    "food",
    "activities",
    "shopping",
    "miscellaneous",
]

BudgetStatusType = Literal[
    "under_budget",
    "within_budget",
    "over_budget",
]

BUDGET_CATEGORIES = [
    "transport",
    "accommodation",
    "food",
    "activities",
    "shopping",
    "miscellaneous",
]


class CategoryTotals(BaseModel):
    transport: float = Field(default=0.0, ge=0.0)
    accommodation: float = Field(default=0.0, ge=0.0)
    food: float = Field(default=0.0, ge=0.0)
    activities: float = Field(default=0.0, ge=0.0)
    shopping: float = Field(default=0.0, ge=0.0)
    miscellaneous: float = Field(default=0.0, ge=0.0)


class BudgetBreakdown(BaseModel):
    currency: str = Field(default="INR")
    userBudget: float = Field(..., ge=0.0)
    categoryTotals: CategoryTotals
    estimatedTotal: float = Field(..., ge=0.0)
    difference: float
    estimatedPerPerson: float = Field(..., ge=0.0)
    status: BudgetStatusType
    isComplete: bool = Field(default=True)
    unestimatedCategories: List[BudgetCategoryType] = Field(default_factory=list)
    warning: Optional[str] = None


class OptimizeBudgetRequest(BaseModel):
    """
    Request model for Smart Budget Optimization.
    Strictly forbids unexpected properties.
    """
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    itinerary: ItineraryResponse
    userBudget: float = Field(..., gt=0)
    travellers: int = Field(..., ge=1, le=50)
    travelStyle: Optional[str] = None
    interests: Optional[List[str]] = None
    additionalNotes: Optional[str] = Field(default=None, max_length=1000)


class OptimizeBudgetResponse(BaseModel):
    originalBudget: BudgetBreakdown
    optimizedItinerary: ItineraryResponse
    optimizedBudget: BudgetBreakdown
    savings: float = Field(default=0.0, ge=0.0)
    achievedTarget: bool
    tradeOffs: List[str] = Field(default_factory=list)

