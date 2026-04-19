from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.health import router as health_router
from app.api.v1.instagram import router as instagram_router
from app.api.v1.workspaces import router as workspaces_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router)
api_router.include_router(workspaces_router)
api_router.include_router(instagram_router)
api_router.include_router(conversations_router)
