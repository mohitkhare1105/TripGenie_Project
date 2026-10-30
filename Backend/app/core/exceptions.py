from typing import Any, List, Optional
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.logging import logger
from app.config import settings


class AppException(Exception):
    """
    Base application exception with HTTP status code and custom messaging.
    """
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        errors: Optional[List[Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.errors = errors


class PayloadTooLargeException(AppException):
    """Raised when request body exceeds configured byte limit."""
    def __init__(self, message: str = "Request body exceeds size limit of 100 KB"):
        super().__init__(
            message=message,
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
        )


class NotFoundException(AppException):
    """Raised when an entity or resource is not found."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND
        )


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "unknown")
    logger.warning(f"[{request_id}] AppException ({exc.status_code}): {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "data": None,
            "errors": exc.errors,
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "unknown")
    errors = []
    for err in exc.errors():
        field_path = ".".join(str(loc) for loc in err.get("loc", []) if loc != "body")
        errors.append({
            "field": field_path or "body",
            "message": err.get("msg", "Invalid value"),
            "type": err.get("type", "value_error"),
        })

    logger.warning(f"[{request_id}] Validation error: {errors}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "message": "Validation failed",
            "data": None,
            "errors": errors,
        },
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "unknown")
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    logger.warning(f"[{request_id}] HTTP error ({exc.status_code}): {detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": detail,
            "data": None,
            "errors": None,
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "unknown")
    logger.exception(f"[{request_id}] Unhandled error during request processing: {str(exc)}")

    # In production, shield internal implementation details
    error_message = "Internal server error"
    if not settings.is_production:
        error_message = f"Internal server error: {str(exc)}"

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": error_message,
            "data": None,
            "errors": None,
        },
    )

