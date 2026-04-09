from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.repositories.health_repository import HealthRepository
from app.schemas.health import HealthResponse


class HealthService:
    def __init__(self, repository: HealthRepository, settings: Settings) -> None:
        self.repository = repository
        self.settings = settings

    async def get_health(self) -> HealthResponse:
        db_is_reachable = await self.repository.is_database_reachable()
        return HealthResponse(
            app_name=self.settings.app_name,
            environment=self.settings.app_env,
            db_status="up" if db_is_reachable else "down",
        )


def get_health_service(db: AsyncSession = Depends(get_db)) -> HealthService:
    repository = HealthRepository(db=db)
    return HealthService(repository=repository, settings=get_settings())
