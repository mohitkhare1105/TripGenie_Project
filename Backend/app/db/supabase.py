import time
from typing import Any, Dict, Optional
from supabase import create_client, Client
from app.config import settings
from app.core.logging import logger
from app.core.exceptions import DatabaseConfigurationError, DatabaseOperationError


def get_supabase_client(access_token: Optional[str] = None) -> Client:
    """
    Returns an initialized Supabase client.
    If an access token is provided, sets authorization so PostgREST enforces RLS for that user.
    """
    if not settings.is_supabase_configured:
        raise DatabaseConfigurationError(
            "Supabase credentials are not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY."
        )

    try:
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        if access_token:
            client.postgrest.auth(access_token)
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        raise DatabaseOperationError(f"Database client initialization failed: {str(e)}")


def get_supabase_service_client() -> Client:
    """
    Returns a privileged Supabase administrative client using the service role key.
    Use exclusively for trusted background/system tasks.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise DatabaseConfigurationError(
            "Supabase service role credentials not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        )

    try:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase service client: {str(e)}")
        raise DatabaseOperationError(f"Service client initialization failed: {str(e)}")


def check_database_connection(timeout_seconds: float = 3.0) -> Dict[str, Any]:
    """
    Performs a safe connectivity probe to Supabase.
    Returns status without leaking connection strings, secrets, or internal details.
    """
    if not settings.is_supabase_configured:
        return {
            "status": "unconfigured",
            "message": "Supabase database credentials are not configured",
            "healthy": False,
        }

    start_time = time.time()
    try:
        client = get_supabase_client()
        # Light probe using auth settings or simple query
        # auth.get_session() or table probe with limit 0
        client.table("profiles").select("id").limit(1).execute()
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "connected",
            "message": "Database connection verified",
            "healthy": True,
            "latency_ms": latency_ms,
        }
    except Exception as exc:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        logger.warning(f"Database health probe failed after {latency_ms}ms: {exc}")
        return {
            "status": "disconnected",
            "message": "Database service is unreachable",
            "healthy": False,
            "latency_ms": latency_ms,
        }

