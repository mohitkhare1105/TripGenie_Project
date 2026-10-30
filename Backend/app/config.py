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
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API key")
    GEMINI_MODEL: str = Field(default="gemini-2.5-flash", description="Gemini model identifier")
    MAX_BODY_SIZE_BYTES: int = Field(default=102400, description="Max request body size in bytes (100 KB limit)")
    RATE_LIMIT_WINDOW_MS: int = Field(default=900000, description="Rate limit window in milliseconds")
    RATE_LIMIT_MAX_REQUESTS: int = Field(default=20, description="Maximum requests per rate limit window")

    @property
    def is_production(self) -> bool:
        return self.NODE_ENV.lower() == "production"

    @property
    def server_port(self) -> int:
        """
        Ensures FastAPI runs on port 8000 by default to peacefully coexist
        with Express backend on port 5000.
        """
        if self.FASTAPI_PORT is not None:
            return self.FASTAPI_PORT
        if os.getenv("FASTAPI_PORT"):
            try:
                return int(os.environ["FASTAPI_PORT"])
            except ValueError:
                pass
        # If PORT was loaded as 5000 from shared Express .env, default FastAPI to 8000
        if self.PORT == 5000:
            return 8000
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
