import re
import html
from typing import Any, List, Optional


# Control characters (excluding standard whitespace \t, \n, \r)
CONTROL_CHAR_REGEX = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
# Multiple whitespace characters (space, tabs) into single space
MULTIPLE_SPACES_REGEX = re.compile(r"[^\S\r\n]+")
# Dangerous HTML script / tag characters
HTML_TAG_REGEX = re.compile(r"<[^>]*>")


def sanitize_text(
    value: Optional[str],
    max_length: Optional[int] = None,
    strip_tags: bool = True,
    escape_html: bool = True,
) -> Optional[str]:
    """
    Sanitizes user input strings:
    - Normalizes leading/trailing and redundant whitespace.
    - Removes ASCII control characters.
    - Strips dangerous HTML tags while preserving international characters (e.g. accents, non-Latin scripts).
    - Optionally truncates to max_length.
    """
    if value is None:
        return None

    if not isinstance(value, str):
        value = str(value)

    # 1. Strip control characters
    text = CONTROL_CHAR_REGEX.sub("", value)

    # 2. Normalize whitespace
    text = MULTIPLE_SPACES_REGEX.sub(" ", text).strip()

    # 3. Strip HTML tags if requested
    if strip_tags:
        text = HTML_TAG_REGEX.sub("", text)

    # 4. Optional HTML escaping for safe storage & rendering
    if escape_html:
        text = html.escape(text, quote=True)

    # 5. Enforce max_length if specified
    if max_length and len(text) > max_length:
        text = text[:max_length].strip()

    return text


def sanitize_string_list(
    items: Optional[List[str]],
    max_items: Optional[int] = None,
    max_item_length: Optional[int] = None,
    deduplicate: bool = True,
) -> List[str]:
    """
    Sanitizes a list of strings:
    - Sanitizes each string element.
    - Drops empty/whitespace-only items.
    - Optionally deduplicates while preserving order.
    - Restricts total items to max_items.
    """
    if not items:
        return []

    sanitized: List[str] = []
    seen = set()

    for item in items:
        cleaned = sanitize_text(item, max_length=max_item_length, strip_tags=True, escape_html=True)
        if cleaned:
            normalized_key = cleaned.lower()
            if deduplicate and normalized_key in seen:
                continue
            seen.add(normalized_key)
            sanitized.append(cleaned)
            if max_items and len(sanitized) >= max_items:
                break

    return sanitized

