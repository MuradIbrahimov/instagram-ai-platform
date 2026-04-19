from fastapi import Depends
from redis.asyncio import Redis
from redis.exceptions import RedisError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.redis import get_redis
from app.repositories.health_repository import HealthRepository
from app.schemas.health import HealthResponse


class HealthService:
    def __init__(
        self,
        repository: HealthRepository,
        redis_client: Redis,
        settings: Settings,
    ) -> None:
        self.repository = repository
        self.redis_client = redis_client
        self.settings = settings

    async def get_health(self) -> HealthResponse:
        db_is_reachable = await self.repository.is_database_reachable()
        redis_is_reachable = await self.is_redis_reachable()
        status = "ok" if db_is_reachable and redis_is_reachable else "degraded"

        return HealthResponse(
            app_name=self.settings.app_name,
            env=self.settings.app_env,
            version=self.settings.app_version,
            status=status,
            db_status="ok" if db_is_reachable else "down",
            redis_status="ok" if redis_is_reachable else "down",
        )

    async def is_redis_reachable(self) -> bool:
        try:
            return bool(await self.redis_client.ping())
        except RedisError:
            return False


def get_health_service(
    db: AsyncSession = Depends(get_db),
    redis_client: Redis = Depends(get_redis),
) -> HealthService:
    repository = HealthRepository(db=db)
    return HealthService(
        repository=repository,
        redis_client=redis_client,
        settings=get_settings(),
    )
