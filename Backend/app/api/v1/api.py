from fastapi import APIRouter
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.trips import router as trips_router
from app.api.v1.endpoints.itineraries import router as itineraries_router
from app.api.v1.endpoints.images import router as images_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(users_router)
api_router.include_router(trips_router)
api_router.include_router(itineraries_router)
api_router.include_router(images_router)
