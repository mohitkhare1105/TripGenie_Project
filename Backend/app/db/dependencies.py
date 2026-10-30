from fastapi import Depends
from supabase import Client
from app.core.auth import get_current_user
from app.db.supabase import get_supabase_client
from app.schemas.user import UserContext


def get_anon_db() -> Client:
    """
    Dependency providing an unauthenticated Supabase client using SUPABASE_ANON_KEY.
    """
    return get_supabase_client()


def get_user_db(current_user: UserContext = Depends(get_current_user)) -> Client:
    """
    Dependency providing an authenticated Supabase client carrying the user's JWT.
    PostgREST enforces PostgreSQL Row Level Security (RLS) under auth.uid() = current_user.user_id.
    """
    return get_supabase_client(access_token=current_user.access_token)

