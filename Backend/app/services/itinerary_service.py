from typing import Optional
from app.config import settings
from app.schemas.itinerary import ItineraryRequest, GeneratedItineraryData
from app.services.budget_service import BudgetService, budget_service
from app.services.ai.itinerary_provider import ItineraryProvider, UnconfiguredItineraryProvider
from app.services.ai.groq_provider import GroqItineraryProvider


class ItineraryService:
    """
    Orchestration service coordinating AI generation and deterministic financial accounting.
    """

    def __init__(
        self,
        provider: Optional[ItineraryProvider] = None,
        budget_srv: Optional[BudgetService] = None,
    ):
        if provider is not None:
            self.provider = provider
        elif settings.is_groq_configured:
            self.provider = GroqItineraryProvider()
        else:
            self.provider = UnconfiguredItineraryProvider()
        self.budget_srv = budget_srv or budget_service

    def set_provider(self, provider: ItineraryProvider) -> None:
        """
        Allows runtime dependency injection of AI provider (used in Phase 4 and unit tests).
        """
        self.provider = provider

    async def generate_itinerary(self, request: ItineraryRequest) -> GeneratedItineraryData:
        # 1. Generate structured itinerary via configured provider
        raw_itinerary = await self.provider.generate_itinerary(request)

        # 2. Perform deterministic budget calculations on server
        budget_breakdown = self.budget_srv.calculate_budget(
            itinerary=raw_itinerary,
            user_budget=request.budget,
            travellers=request.travellers,
        )

        # 3. Assemble complete response payload
        return GeneratedItineraryData(
            trip=raw_itinerary.trip,
            days=raw_itinerary.days,
            budget=budget_breakdown,
            notes=raw_itinerary.notes,
        )


itinerary_service = ItineraryService()

