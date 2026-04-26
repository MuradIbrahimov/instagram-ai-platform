from fastapi import APIRouter

from app.api.v1.ai_settings import router as ai_settings_router
from app.api.v1.auth import router as auth_router
from app.api.v1.knowledge import router as knowledge_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.health import router as health_router
from app.api.v1.instagram import router as instagram_router
from app.api.v1.webhooks import router as webhooks_router
from app.api.v1.workspaces import router as workspaces_router
from app.core.config import get_settings

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router)
api_router.include_router(workspaces_router)
api_router.include_router(instagram_router)
api_router.include_router(conversations_router)
api_router.include_router(webhooks_router)
api_router.include_router(ai_settings_router)
api_router.include_router(knowledge_router)

# Debug routes — mounted only when DEBUG=true
if get_settings().debug:
    from app.api.v1.debug import router as debug_router
    api_router.include_router(debug_router)
