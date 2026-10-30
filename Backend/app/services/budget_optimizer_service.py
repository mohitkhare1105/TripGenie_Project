import json
from typing import Optional, Tuple
from app.config import settings
from app.schemas.itinerary import ItineraryResponse
from app.schemas.budget import OptimizeBudgetRequest, OptimizeBudgetResponse
from app.services.budget_service import BudgetService, budget_service
from app.services.ai.itinerary_provider import ItineraryProvider, UnconfiguredItineraryProvider
from app.services.ai.groq_provider import GroqItineraryProvider


def build_optimization_prompt(
    itinerary: ItineraryResponse,
    user_budget: float,
    current_total: float,
    excess_amount: float,
    travellers: int,
    travel_style: Optional[str] = None,
    interests: Optional[list] = None,
) -> Tuple[str, str]:
    destination = itinerary.trip.destination
    duration_days = itinerary.trip.durationDays

    system_instruction = f"""You are TripGenie AI's Smart Budget Optimizer.
Your goal is to propose practical, lower-cost alternative activities, dining, and transit options for an itinerary that currently exceeds the traveller's budget.

STRICT CONSTRAINTS & RULES:
1. Return ONLY valid JSON adhering strictly to the response schema. No markdown wrapping, no commentary.
2. PRESERVE CORE CONTEXT:
   - Destination: {destination}
   - Duration: EXACTLY {duration_days} days (numbered 1 through {duration_days} in sequence).
   - Travellers: {travellers}
   - Primary interests: {', '.join(interests) if interests else 'maintain current themes'}.
   - Travel style: {travel_style or 'maintain current style'}.
3. BUDGET TARGET:
   - Current Estimated Cost: INR {int(current_total)}
   - Target User Budget: INR {int(user_budget)}
   - Target Reduction: At least INR {int(excess_amount)}
4. OPTIMIZATION STRATEGIES:
   - Swap costly private transport for public transit, metro, or scenic walking routes.
   - Recommend authentic local street food, dhabas, and budget-friendly cafes instead of fine dining.
   - Choose free or low-cost cultural spots, parks, and viewpoints over expensive commercial tourist attractions.
   - Document key adjustments and trade-offs in the "notes" array.
5. REALISM:
   - Do NOT fabricate live discounts or claim verified low rates.
   - All costs must remain non-negative realistic estimates in INR."""

    user_prompt = f"""The following {duration_days}-day trip to {destination} for {travellers} travellers currently costs estimated INR {int(current_total)}, exceeding the budget of INR {int(user_budget)} by INR {int(excess_amount)}.

Current Itinerary:
{json.dumps(itinerary.model_dump(mode="json"), indent=2)}

Please regenerate an optimized, lower-cost {duration_days}-day itinerary adhering strictly to the schema that reduces total expenses toward the INR {int(user_budget)} target."""

    return system_instruction, user_prompt


class BudgetOptimizerService:
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
        Allows runtime dependency injection of AI provider (used in unit tests).
        """
        self.provider = provider

    async def optimize_budget(self, request: OptimizeBudgetRequest) -> OptimizeBudgetResponse:
        # 1. Deterministically calculate original budget in backend
        original_budget = self.budget_srv.calculate_budget(
            request.itinerary,
            request.userBudget,
            request.travellers,
        )

        excess_amount = max(0.0, original_budget.estimatedTotal - request.userBudget)

        # 2. If already within budget, short-circuit without calling AI
        if original_budget.status != "over_budget" or excess_amount <= 0:
            return OptimizeBudgetResponse(
                originalBudget=original_budget,
                optimizedItinerary=request.itinerary,
                optimizedBudget=original_budget,
                savings=0.0,
                achievedTarget=True,
                tradeOffs=[
                    "Itinerary is already within the specified budget; no cost reduction necessary."
                ],
            )

        # 3. Build prompt and invoke AI provider
        system_instruction, user_prompt = build_optimization_prompt(
            request.itinerary,
            request.userBudget,
            original_budget.estimatedTotal,
            excess_amount,
            request.travellers,
            request.travelStyle,
            request.interests,
        )

        proposed_itinerary = await self.provider.optimize_itinerary(
            prompt=user_prompt,
            system_instruction=system_instruction,
            duration_days=request.itinerary.trip.durationDays,
            destination=request.itinerary.trip.destination,
        )

        # 4. Deterministically recalculate revised budget in backend
        optimized_budget = self.budget_srv.calculate_budget(
            proposed_itinerary,
            request.userBudget,
            request.travellers,
        )

        # 5. Compute savings & target achievement
        savings = max(0.0, original_budget.estimatedTotal - optimized_budget.estimatedTotal)
        achieved_target = optimized_budget.status != "over_budget"

        trade_offs = (
            proposed_itinerary.notes
            if proposed_itinerary.notes
            else [f"Saved approximately INR {int(savings):,} by selecting cost-effective local alternatives."]
        )

        return OptimizeBudgetResponse(
            originalBudget=original_budget,
            optimizedItinerary=proposed_itinerary,
            optimizedBudget=optimized_budget,
            savings=float(savings),
            achievedTarget=achieved_target,
            tradeOffs=trade_offs,
        )


budget_optimizer_service = BudgetOptimizerService()

