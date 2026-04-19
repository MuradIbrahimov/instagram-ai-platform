from collections.abc import AsyncGenerator

from redis.asyncio import Redis

from app.core.config import get_settings

settings = get_settings()
redis_client = Redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)


async def get_redis() -> AsyncGenerator[Redis, None]:
    yield redis_client


async def ping_redis() -> bool:
    try:
        return bool(await redis_client.ping())
    except Exception:
        return False
