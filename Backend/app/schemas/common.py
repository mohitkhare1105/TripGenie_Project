from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class HealthData(BaseModel):
    """
    Health check payload matching TripGenie AI system health contracts.
    """
    status: str = Field(default="healthy", description="Service status indicator")
    uptime: int = Field(..., description="Server uptime in seconds")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")


class ValidationErrorDetail(BaseModel):
    """
    Structured validation error item.
    """
    field: str = Field(..., description="Path/name of the invalid field")
    message: str = Field(..., description="Explanation of validation constraint violation")
    type: Optional[str] = Field(default=None, description="Error type identifier")


class ApiResponse(BaseModel, Generic[T]):
    """
    Standardized API response envelope used across all TripGenie endpoints.
    """
    success: bool = Field(default=True, description="Indicates whether the request succeeded")
    message: str = Field(default="Success", description="Human-readable status or error description")
    data: Optional[T] = Field(default=None, description="Payload data returned on success")
    errors: Optional[List[Any]] = Field(default=None, description="Detailed validation or operational error items")


class ErrorResponse(BaseModel):
    """
    Dedicated error response envelope.
    """
    success: bool = Field(default=False, description="Always false for error responses")
    message: str = Field(..., description="Error message")
    data: Optional[Any] = Field(default=None, description="Always null on error")
    errors: Optional[List[Any]] = Field(default=None, description="List of granular error items if any")

