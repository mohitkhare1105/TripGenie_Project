from fastapi import APIRouter, Depends, Request
from app.core.auth import get_optional_user
from app.middleware.duplicate_request import (
    DuplicateRequestGuard,
    generate_request_fingerprint,
)
from app.schemas.common import ApiResponse
from app.schemas.itinerary import ItineraryRequest, GeneratedItineraryData
from app.schemas.budget import OptimizeBudgetRequest, OptimizeBudgetResponse
from app.schemas.user import UserContext
from app.services.itinerary_service import itinerary_service
from app.services.budget_optimizer_service import budget_optimizer_service

router = APIRouter(prefix="/itineraries", tags=["Itineraries"])


@router.post(
    "/generate",
    response_model=ApiResponse[GeneratedItineraryData],
    summary="Generate personalized travel itinerary",
    description="Generates day-wise timeline and calculates deterministic budget totals on the server.",
)
async def generate_itinerary(
    request: ItineraryRequest,
    raw_request: Request,
    optional_user: UserContext = Depends(get_optional_user),
) -> ApiResponse[GeneratedItineraryData]:
    client_ip = raw_request.client.host if raw_request.client else "unknown"
    fingerprint = generate_request_fingerprint(request.model_dump(mode="json"), client_ip=client_ip)

    with DuplicateRequestGuard(fingerprint):
        result = await itinerary_service.generate_itinerary(request)

    return ApiResponse[GeneratedItineraryData](
        success=True,
        message="Itinerary generated successfully",
        data=result,
    )


@router.post(
    "/optimize-budget",
    response_model=ApiResponse[OptimizeBudgetResponse],
    summary="Smart Budget Optimizer",
    description="Proposes lower-cost alternatives and deterministically recalculates revised totals.",
)
async def optimize_budget(
    request: OptimizeBudgetRequest,
    raw_request: Request,
    optional_user: UserContext = Depends(get_optional_user),
) -> ApiResponse[OptimizeBudgetResponse]:
    client_ip = raw_request.client.host if raw_request.client else "unknown"
    fingerprint = generate_request_fingerprint(request.model_dump(mode="json"), client_ip=client_ip)

    with DuplicateRequestGuard(fingerprint):
        result = await budget_optimizer_service.optimize_budget(request)

    return ApiResponse[OptimizeBudgetResponse](
        success=True,
        message="Budget optimization completed",
        data=result,
    )

