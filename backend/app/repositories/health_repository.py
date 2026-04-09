from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession


class HealthRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def is_database_reachable(self) -> bool:
        try:
            await self.db.execute(text("SELECT 1"))
            return True
        except SQLAlchemyError:
            return False
