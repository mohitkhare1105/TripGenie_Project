from pathlib import Path

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "supabase" / "migrations"


def test_migration_files_exist():
    """Verify that all three required SQL migration files exist."""
    assert (MIGRATIONS_DIR / "001_create_profiles.sql").is_file()
    assert (MIGRATIONS_DIR / "002_create_trips.sql").is_file()
    assert (MIGRATIONS_DIR / "003_create_user_preferences.sql").is_file()


def test_migrations_enable_row_level_security():
    """Verify that every migration file explicitly enables Row Level Security (RLS)."""
    for sql_file in MIGRATIONS_DIR.glob("*.sql"):
        content = sql_file.read_text(encoding="utf-8")
        assert "ENABLE ROW LEVEL SECURITY" in content, f"{sql_file.name} must enable RLS"


def test_migrations_use_auth_uid_policies():
    """Verify that every migration policy uses Supabase auth.uid() for strict user isolation."""
    for sql_file in MIGRATIONS_DIR.glob("*.sql"):
        content = sql_file.read_text(encoding="utf-8")
        assert "auth.uid()" in content, f"{sql_file.name} policies must reference auth.uid()"
        assert "FOR SELECT" in content
        assert "FOR INSERT" in content
        assert "FOR UPDATE" in content
        assert "FOR DELETE" in content

