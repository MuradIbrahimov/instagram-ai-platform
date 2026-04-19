from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    app_name: str
    env: str
    version: str
    status: Literal["ok", "degraded"]
    db_status: Literal["ok", "down"]
    redis_status: Literal["ok", "down"]
