"""
TripGenie AI FastAPI Backend Application Package
"""

from .main import app, create_app
from .config import settings

__all__ = ["app", "create_app", "settings"]

