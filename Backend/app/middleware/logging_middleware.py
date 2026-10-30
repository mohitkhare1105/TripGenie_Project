import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.config import settings
from app.core.logging import logger, redact_secrets


class RequestLoggingAndLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware handling:
    1. X-Request-ID extraction / generation and propagation.
    2. Request body size limit enforcement (100 KB max).
    3. Safe request & response timing logs with secret redaction.
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()

        # 1. Request ID management
        incoming_req_id = request.headers.get("X-Request-ID")
        request_id = incoming_req_id if incoming_req_id else f"req_{int(start_time*1000)}_{uuid.uuid4().hex[:7]}"
        request.state.request_id = request_id

        # 2. Body size limit enforcement (100 KB = 102400 bytes)
        content_length_header = request.headers.get("content-length")
        if content_length_header:
            try:
                content_length = int(content_length_header)
                if content_length > settings.MAX_BODY_SIZE_BYTES:
                    logger.warning(
                        f"[{request_id}] Request body size {content_length} exceeds limit of "
                        f"{settings.MAX_BODY_SIZE_BYTES} bytes"
                    )
                    return JSONResponse(
                        status_code=413,
                        content={
                            "success": False,
                            "message": "Request body exceeds size limit of 100 KB",
                            "data": None,
                            "errors": None,
                        },
                        headers={"X-Request-ID": request_id},
                    )
            except ValueError:
                pass

        # 3. Safe incoming log (safe URL query strings)
        safe_path = redact_secrets(str(request.url))
        logger.info(f"[{request_id}] Incoming {request.method} {request.url.path}")

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(f"[{request_id}] Request failed after {duration_ms}ms: {exc}")
            raise

        duration_ms = round((time.time() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        logger.info(f"[{request_id}] Completed {request.method} {request.url.path} with status {response.status_code} in {duration_ms}ms")

        return response

