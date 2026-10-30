import hashlib
import json
import threading
from typing import Set
from fastapi import Request
from app.core.exceptions import AppException

# Set of active in-flight request hashes
_in_flight_locks: Set[str] = set()
_lock = threading.Lock()


class ConcurrentDuplicateError(AppException):
    def __init__(
        self,
        message: str = "A request with the same parameters is currently in flight. Please wait for it to complete.",
    ):
        super().__init__(message=message, status_code=429)


def generate_request_fingerprint(request_data: dict, client_ip: str = "unknown") -> str:
    """
    Computes a SHA-256 fingerprint from request data and client origin.
    """
    serialized = json.dumps(request_data, sort_keys=True)
    combined = f"{client_ip}:{serialized}"
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()


class DuplicateRequestGuard:
    """
    Context manager protecting against duplicate concurrent in-flight requests.
    """

    def __init__(self, fingerprint: str):
        self.fingerprint = fingerprint

    def __enter__(self):
        with _lock:
            if self.fingerprint in _in_flight_locks:
                raise ConcurrentDuplicateError()
            _in_flight_locks.add(self.fingerprint)

    def __exit__(self, exc_type, exc_val, exc_tb):
        with _lock:
            _in_flight_locks.discard(self.fingerprint)


def clear_in_flight_locks() -> None:
    """Helper for testing: clears active locks."""
    with _lock:
        _in_flight_locks.clear()

