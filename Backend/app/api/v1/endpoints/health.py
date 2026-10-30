import time
from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from app.schemas.common import ApiResponse, HealthData
from app.db.supabase import check_database_connection

router = APIRouter()

# Global fallback start time
_PROCESS_START_TIME = time.time()


@router.api_route(
    "/health",
    methods=["GET", "HEAD"],
    response_model=ApiResponse[HealthData],
    summary="Health check endpoint",
    description="Returns server status, uptime in seconds, and UTC ISO timestamp.",
)
async def get_health(request: Request) -> ApiResponse[HealthData]:
    """
    Standard service health probe.
    Does not depend on Supabase or external credentials.
    """
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


@router.get(
    "/health/database",
    summary="Diagnostic database connectivity probe",
    description="Checks Supabase connectivity with bounded timeout without leaking secrets.",
)
async def get_database_health() -> JSONResponse:
    """
    Diagnostic database health check.
    Returns HTTP 200 if connected, or HTTP 503 if unconfigured/unreachable.
    """
    db_status = check_database_connection()
    status_code = status.HTTP_200_OK if db_status.get("healthy") else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "success": db_status.get("healthy", False),
            "message": db_status.get("message", "Database check completed"),
            "data": {
                "status": db_status.get("status"),
                "healthy": db_status.get("healthy", False),
                "latency_ms": db_status.get("latency_ms"),
            },
        },
    )
