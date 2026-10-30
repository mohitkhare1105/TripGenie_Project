import uuid
from typing import Any, Dict, Optional
import jwt
from fastapi import Header
from app.config import settings
from app.core.exceptions import AuthenticationError
from app.core.logging import logger
from app.schemas.user import UserContext


def extract_bearer_token(authorization: Optional[str]) -> str:
    """
    Extracts and validates Bearer token format from Authorization header.
    Raises AuthenticationError (HTTP 401) on failure.
    """
    if not authorization:
        raise AuthenticationError("Missing Authorization header with Bearer token")

    parts = authorization.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthenticationError("Invalid Authorization header format. Expected 'Bearer <token>'")

    token = parts[1].strip()
    if not token:
        raise AuthenticationError("Bearer token cannot be empty")

    return token


def verify_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Verifies a Supabase JWT.
    Supports:
    1. Local signature verification via SUPABASE_JWT_SECRET (HS256).
    2. Supabase GoTrue Auth API verification via get_user(token) for projects with asymmetric or rotated keys.
    """
    # 1. Attempt local JWT secret verification if configured
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience=["authenticated", "anon"],
                options={"verify_exp": True, "verify_aud": False},
            )
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token verification failed: JWT has expired")
            raise AuthenticationError("Token has expired")
        except jwt.InvalidSignatureError:
            logger.warning("Token verification failed: Invalid JWT signature")
            raise AuthenticationError("Invalid token signature")
        except jwt.PyJWTError as e:
            logger.warning(f"Token verification failed: {str(e)}")
            raise AuthenticationError(f"Token verification failed: {str(e)}")

    # 2. If no local secret is configured, fallback to Supabase GoTrue Auth API
    if settings.is_supabase_configured:
        try:
            from app.db.supabase import get_supabase_client
            client = get_supabase_client()
            user_response = client.auth.get_user(token)
            if user_response and user_response.user:
                user = user_response.user
                return {
                    "sub": str(user.id),
                    "email": getattr(user, "email", None),
                    "role": getattr(user, "role", "authenticated"),
                    "user_metadata": getattr(user, "user_metadata", {}),
                }
            raise AuthenticationError("Invalid or expired session from auth provider")
        except Exception as exc:
            logger.warning(f"Remote Supabase auth validation failed: {str(exc)}")
            raise AuthenticationError("Authentication failed: invalid or revoked token")

    # If neither is available, token cannot be verified
    raise AuthenticationError(
        "Authentication is unavailable: Supabase credentials or SUPABASE_JWT_SECRET must be configured."
    )


async def get_current_user(authorization: Optional[str] = Header(None)) -> UserContext:
    """
    FastAPI dependency requiring a valid Supabase authenticated user.
    Returns typed UserContext or raises HTTP 401.
    """
    token = extract_bearer_token(authorization)
    payload = verify_supabase_jwt(token)

    sub = payload.get("sub")
    if not sub:
        raise AuthenticationError("Token payload missing subject identifier ('sub')")

    try:
        user_uuid = uuid.UUID(str(sub))
    except (ValueError, TypeError, AttributeError):
        raise AuthenticationError("Token subject is not a valid UUID")

    email = payload.get("email")
    role = payload.get("role", "authenticated")
    metadata = payload.get("user_metadata", {})

    return UserContext(
        user_id=user_uuid,
        email=email,
        role=role,
        access_token=token,
        metadata=metadata,
    )


async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[UserContext]:
    """
    FastAPI dependency that returns UserContext if a valid Authorization header is present,
    or None if no Authorization header was provided.
    Raises HTTP 401 if an invalid/expired token was provided.
    """
    if not authorization:
        return None
    return await get_current_user(authorization)

