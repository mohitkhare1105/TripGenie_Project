import os
from unittest.mock import patch
from app.config import Settings
from app.core.logging import redact_secrets


def test_supabase_config_defaults():
    """Verify default Supabase settings are None when not configured."""
    custom_settings = Settings(
        SUPABASE_URL=None,
        SUPABASE_ANON_KEY=None,
        SUPABASE_SERVICE_ROLE_KEY=None,
        SUPABASE_JWT_SECRET=None,
    )
    assert custom_settings.is_supabase_configured is False
    assert custom_settings.SUPABASE_URL is None
    assert custom_settings.SUPABASE_ANON_KEY is None


def test_supabase_config_when_provided():
    """Verify is_supabase_configured is True when URL and ANON_KEY are present."""
    custom_settings = Settings(
        SUPABASE_URL="https://testproject.supabase.co",
        SUPABASE_ANON_KEY="test-anon-key-12345",
    )
    assert custom_settings.is_supabase_configured is True
    assert custom_settings.SUPABASE_URL == "https://testproject.supabase.co"


def test_secret_redaction_supabase_keys():
    """Verify that Supabase keys, JWTs, and secrets are redacted from log messages."""
    sample_key = "sbp_abcdef0123456789abcdef0123456789"
    sample_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozG4B_fake_signature_here_12345"
    log_line = f"Connecting with {sample_key} and token {sample_jwt} and password=mysecretpass"

    redacted = redact_secrets(log_line)
    assert sample_key not in redacted
    assert sample_jwt not in redacted
    assert "mysecretpass" not in redacted
    assert "[REDACTED_KEY]" in redacted or "[REDACTED]" in redacted

