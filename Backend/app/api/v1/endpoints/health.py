import time
from datetime import datetime, timezone
from fastapi import APIRouter, Request
from app.schemas.common import ApiResponse, HealthData

router = APIRouter()

# Global fallback start time
_PROCESS_START_TIME = time.time()


@router.get(
    "/health",
    response_model=ApiResponse[HealthData],
    summary="Health check endpoint",
    description="Returns server status, uptime in seconds, and UTC ISO timestamp.",
)
async def get_health(request: Request) -> ApiResponse[HealthData]:
    # Retrieve server startup time from app.state or fallback
    app_start_time = getattr(request.app.state, "start_time", _PROCESS_START_TIME)
    uptime_seconds = int(time.time() - app_start_time)
    current_time_utc = datetime.now(timezone.utc).isoformat()

    return ApiResponse[HealthData](
        success=True,
        message="TripGenie AI backend is running",
        data=HealthData(
            status="healthy",
            uptime=uptime_seconds,
            timestamp=current_time_utc,
        ),
    )

