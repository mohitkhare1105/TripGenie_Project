from app.utils.sanitization import sanitize_text, sanitize_string_list


def test_sanitize_whitespace_normalization():
    """Verify leading/trailing and duplicate whitespace is normalized."""
    raw = "   New    Delhi   "
    assert sanitize_text(raw, escape_html=False) == "New Delhi"


def test_sanitize_control_characters():
    """Verify ASCII control characters are stripped."""
    raw = "Goa\x00\x08Beach\x1f"
    assert sanitize_text(raw, escape_html=False) == "GoaBeach"


def test_sanitize_preserves_international_and_punctuation():
    """Verify legitimate international characters and punctuation are preserved."""
    assert sanitize_text("São Paulo", escape_html=False) == "São Paulo"
    assert sanitize_text("Zürich", escape_html=False) == "Zürich"
    assert sanitize_text("St. John's", escape_html=False) == "St. John's"
    assert sanitize_text("Stratford-upon-Avon", escape_html=False) == "Stratford-upon-Avon"


def test_sanitize_strips_html_tags():
    """Verify HTML tags are removed while text is preserved."""
    raw = "<script>alert('xss')</script>Jaipur"
    assert sanitize_text(raw, escape_html=False) == "alert('xss')Jaipur"


def test_sanitize_string_list_deduplication():
    """Verify string list sanitization cleans items and removes duplicates."""
    items = ["Trekking", "  trekking ", "History", ""]
    result = sanitize_string_list(items, deduplicate=True)
    assert len(result) == 2
    assert "Trekking" in result
    assert "History" in result

