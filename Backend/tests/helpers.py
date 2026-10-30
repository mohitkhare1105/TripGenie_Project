import time
import jwt

TEST_SECRET = "super-secret-test-jwt-signing-key-for-tripgenie-phase-2"
TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"


def generate_test_jwt(
    user_id: str = TEST_USER_ID,
    email: str = "traveler@tripgenie.ai",
    exp_delta: int = 3600,
    secret: str = TEST_SECRET,
    algorithm: str = "HS256",
) -> str:
    """
    Generates a mock Supabase JWT token for automated unit & integration testing.
    """
    payload = {
        "sub": user_id,
        "email": email,
        "role": "authenticated",
        "aud": "authenticated",
        "exp": int(time.time()) + exp_delta,
        "user_metadata": {"full_name": "Test Traveler"},
    }
    return jwt.encode(payload, secret, algorithm=algorithm)

