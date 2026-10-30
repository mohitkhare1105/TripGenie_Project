import logging
import re
import sys
from typing import Any, Dict

# Regex patterns for sensitive credentials
API_KEY_PATTERN = re.compile(r"(AIza[0-9A-Za-z-_]{35}|AQ\.[A-Za-z0-9_-]+|sbp_[a-zA-Z0-9]{20,}|gsk_[a-zA-Z0-9]{20,})")
AUTH_HEADER_PATTERN = re.compile(r"Bearer\s+[A-Za-z0-9\-._~+/]+=*", re.IGNORECASE)
JWT_PATTERN = re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}")
KEY_VALUE_PATTERN = re.compile(
    r'("?(?:apiKey|password|secret|key|token|supabase_key|service_role_key|groq_api_key)"?\s*[:=]\s*)"?[^",\s]+"?(?=,|\s|"|$)',
    re.IGNORECASE
)


def redact_secrets(val: Any) -> Any:
    """
    Recursively redacts API keys, tokens, JWTs, and passwords from logs.
    """
    if isinstance(val, str):
        val = API_KEY_PATTERN.sub("[REDACTED_KEY]", val)
        val = AUTH_HEADER_PATTERN.sub("Bearer [REDACTED_TOKEN]", val)
        val = JWT_PATTERN.sub("[REDACTED_JWT]", val)
        val = KEY_VALUE_PATTERN.sub(r'\1"[REDACTED]"', val)
        return val
    elif isinstance(val, dict):
        sanitized = {}
        for k, v in val.items():
            if re.search(r"password|secret|apikey|key|token|auth", k, re.IGNORECASE):
                sanitized[k] = "[REDACTED]"
            else:
                sanitized[k] = redact_secrets(v)
        return sanitized
    elif isinstance(val, list):
        return [redact_secrets(item) for item in val]
    return val


class SafeLogFormatter(logging.Formatter):
    """
    Logging formatter that ensures no sensitive credentials appear in log output.
    """
    def format(self, record: logging.LogRecord) -> str:
        original_msg = record.getMessage()
        record.msg = str(redact_secrets(original_msg))
        record.args = None
        return super().format(record)


def setup_logger(name: str = "tripgenie") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = SafeLogFormatter(
            fmt="[%(levelname)s] [%(asctime)s] %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S%z"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    logger.propagate = False
    return logger


logger = setup_logger()
