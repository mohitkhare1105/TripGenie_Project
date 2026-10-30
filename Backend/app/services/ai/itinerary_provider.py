from abc import ABC, abstractmethod
from typing import Optional
from app.core.exceptions import AppException
from app.schemas.itinerary import ItineraryRequest, ItineraryResponse


class AiServiceError(AppException):
    """
    Base exception for AI provider communication or payload failure.
    """
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message=message, status_code=status_code)


class AiServiceUnavailableError(AppException):
    """
    Raised when the AI provider is not configured or offline.
    """
    def __init__(
        self,
        message: str = (
            "AI itinerary generation service is currently unavailable. "
            "Provider integration is scheduled for Phase 4."
        ),
    ):
        super().__init__(message=message, status_code=503)


class ItineraryProvider(ABC):
    """
    Provider-agnostic interface for AI itinerary generation and optimization.
    Decouples business logic from external LLM providers (e.g. Groq Cloud).
    """

    @abstractmethod
    async def generate_itinerary(self, request: ItineraryRequest) -> ItineraryResponse:
        """
        Generates a structured day-wise itinerary based on user travel preferences.
        """
        pass

    @abstractmethod
    async def optimize_itinerary(
        self,
        prompt: str,
        system_instruction: str,
        duration_days: int,
        destination: str,
    ) -> ItineraryResponse:
        """
        Proposes an optimized, lower-cost itinerary matching user constraints.
        """
        pass


class UnconfiguredItineraryProvider(ItineraryProvider):
    """
    Default provider placeholder for Phase 3 before Phase 4 Groq migration.
    Returns a clean, documented HTTP 503 response without fabricating fake AI data.
    """

    async def generate_itinerary(self, request: ItineraryRequest) -> ItineraryResponse:
        raise AiServiceUnavailableError(
            "AI itinerary generation provider is not configured for Phase 3. "
            "Real AI provider integration is scheduled for Phase 4."
        )

    async def optimize_itinerary(
        self,
        prompt: str,
        system_instruction: str,
        duration_days: int,
        destination: str,
    ) -> ItineraryResponse:
        raise AiServiceUnavailableError(
            "AI budget optimization provider is not configured for Phase 3. "
            "Real AI provider integration is scheduled for Phase 4."
        )

