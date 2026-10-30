from .health import router as health_router
from .users import router as users_router
from .trips import router as trips_router
from .itineraries import router as itineraries_router

__all__ = [
    "health_router",
    "users_router",
    "trips_router",
    "itineraries_router",
]
