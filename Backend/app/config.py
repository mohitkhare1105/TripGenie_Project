import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """
    Application configuration managed through environment variables.
    Reads from Backend/.env, environment variables, or system defaults.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PORT: int = Field(default=8000, description="Port the FastAPI server listens on")
    FASTAPI_PORT: Optional[int] = Field(default=None, description="Explicit override port for FastAPI")
    HOST: str = Field(default="0.0.0.0", description="Host address for binding")
    NODE_ENV: str = Field(default="development", description="Environment: development or production")
    CLIENT_ORIGIN: str = Field(
        default="http://localhost:5173",
        description="Allowed frontend origin(s), comma-separated"
    )

    # Groq AI Configuration (Phase 4 Primary LLM Provider)
    GROQ_API_KEY: Optional[str] = Field(default=None, description="Groq Cloud API key")
    GROQ_MODEL: str = Field(default="openai/gpt-oss-120b", description="Default Groq LLM model")
    GROQ_TIMEOUT: float = Field(default=30.0, description="Groq API timeout in seconds")
    GROQ_MAX_RETRIES: int = Field(default=1, description="Max retries for transient Groq errors")

    # Unsplash API Configuration (Phase 5 Destination Images)
    UNSPLASH_ACCESS_KEY: Optional[str] = Field(default=None, description="Unsplash API access key")
    UNSPLASH_TIMEOUT: float = Field(default=10.0, description="Unsplash API request timeout in seconds")

    MAX_BODY_SIZE_BYTES: int = Field(default=102400, description="Max request body size in bytes (100 KB limit)")
    RATE_LIMIT_WINDOW_MS: int = Field(default=900000, description="Rate limit window in milliseconds")
    RATE_LIMIT_MAX_REQUESTS: int = Field(default=20, description="Maximum requests per rate limit window")

    # Supabase Configuration (Optional for app startup; required only for db/auth operations)
    SUPABASE_URL: Optional[str] = Field(default=None, description="Supabase project URL (e.g. https://xyz.supabase.co)")
    SUPABASE_ANON_KEY: Optional[str] = Field(default=None, description="Supabase public anon key")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = Field(default=None, description="Supabase service role administrative key (optional)")
    SUPABASE_JWT_SECRET: Optional[str] = Field(default=None, description="Supabase JWT secret for symmetric token verification (optional)")

    @property
    def is_production(self) -> bool:
        return self.NODE_ENV.lower() == "production"

    @property
    def is_supabase_configured(self) -> bool:
        """Indicates whether minimal Supabase client credentials are present."""
        return bool(self.SUPABASE_URL and self.SUPABASE_ANON_KEY)

    @property
    def is_groq_configured(self) -> bool:
        """Indicates whether Groq API key is configured."""
        return bool(self.GROQ_API_KEY and self.GROQ_API_KEY.strip())

    @property
    def is_unsplash_configured(self) -> bool:
        """Indicates whether Unsplash Access key is configured."""
        return bool(self.UNSPLASH_ACCESS_KEY and self.UNSPLASH_ACCESS_KEY.strip())

    @property
    def server_port(self) -> int:
        """
        Determines listening port: checks FASTAPI_PORT override, then PORT (assigned by Render in production, default 8000).
        """
        if self.FASTAPI_PORT is not None:
            return self.FASTAPI_PORT
        if os.getenv("FASTAPI_PORT"):
            try:
                return int(os.environ["FASTAPI_PORT"])
            except ValueError:
                pass
        return self.PORT

    @property
    def allowed_origins(self) -> List[str]:
        origins = [o.strip() for o in self.CLIENT_ORIGIN.split(",") if o.strip()]
        if not self.is_production:
            # Allow common local development origins in non-production
            for local_origin in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]:
                if local_origin not in origins:
                    origins.append(local_origin)
        return origins


settings = Settings()
