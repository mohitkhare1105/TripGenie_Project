import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.core.logging import logger
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    unhandled_exception_handler,
)
from app.middleware.logging_middleware import RequestLoggingAndLimitMiddleware
from app.middleware.security import SecurityHeadersMiddleware
from app.api.v1.api import api_router
from app.api.v1.endpoints.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handling graceful startup, resource initialization,
    and graceful shutdown.
    """
    app.state.start_time = time.time()
    logger.info(
        f"TripGenie AI Backend (FastAPI) starting up in [{settings.NODE_ENV}] mode "
        f"on port {settings.server_port}"
    )
    logger.info(f"Allowed CORS origins: {settings.allowed_origins}")

    yield

    logger.info("TripGenie AI Backend shutting down gracefully...")


def create_app() -> FastAPI:
    """
    FastAPI application factory for TripGenie AI backend.
    """
    app = FastAPI(
        title="TripGenie AI Backend",
        description="FastAPI service for TripGenie AI personalized travel itinerary planner.",
        version="1.0.0",
        lifespan=lifespan,
    )

    # 1. CORS Configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    # 2. Security Headers Middleware
    app.add_middleware(SecurityHeadersMiddleware)

    # 3. Request Logging & Body Size Limiter (100 KB) Middleware
    app.add_middleware(RequestLoggingAndLimitMiddleware)

    # 4. Centralized Exception Handlers
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # 5. Route Registration
    # Primary API routes (/api/health, etc.)
    app.include_router(api_router, prefix="/api")
    # Root health check alias (/health)
    app.include_router(health_router)

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "success": True,
            "message": "TripGenie AI Backend API is active",
            "docs": "/docs",
        }

    return app


app = create_app()

