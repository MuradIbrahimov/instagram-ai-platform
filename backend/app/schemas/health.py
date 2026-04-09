from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    app_name: str
    environment: str
    db_status: Literal["up", "down"]
