from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr


class UserContext(BaseModel):
    """
    Authenticated user context injected via security dependencies.
    """
    user_id: UUID = Field(..., description="Unique UUID of the authenticated Supabase user")
    email: Optional[str] = Field(default=None, description="User's verified email address")
    role: str = Field(default="authenticated", description="Supabase Auth role")
    access_token: str = Field(..., description="Raw access token for RLS client forwarding")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="User metadata from auth token")


class UserProfile(BaseModel):
    """
    User profile data model matching the profiles table.
    """
    id: UUID = Field(..., description="User UUID matching auth.users")
    full_name: Optional[str] = Field(default=None, description="User display or legal name")
    email: Optional[str] = Field(default=None, description="User contact email")
    avatar_url: Optional[str] = Field(default=None, description="URL of user avatar image")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ProfileUpdate(BaseModel):
    """
    Schema for updating user profile fields.
    """
    full_name: Optional[str] = Field(default=None, max_length=150, description="Full name")
    avatar_url: Optional[str] = Field(default=None, max_length=500, description="Avatar image URL")


class UserPreferencesBase(BaseModel):
    """
    Reusable travel preferences schema.
    """
    travel_style: Optional[str] = Field(
        default=None,
        description="Default travel style (adventure, relaxation, family, solo, culture, food)"
    )
    interests: List[str] = Field(
        default_factory=list,
        description="List of user travel interests"
    )
    accommodation_preference: Optional[str] = Field(
        default=None,
        description="Preferred accommodation level (budget, standard, comfort)"
    )
    transport_preference: Optional[str] = Field(
        default=None,
        description="Preferred transit mode (public transport, walking, taxi, rental vehicle)"
    )
    dietary_preferences: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Dietary requirements or restrictions"
    )


class UserPreferencesCreate(UserPreferencesBase):
    pass


class UserPreferencesResponse(UserPreferencesBase):
    id: UUID
    user_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

