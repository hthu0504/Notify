from pydantic import BaseModel, Field
from typing import Any

class DashboardState(BaseModel):
    widgets: list[dict[str, Any]] = Field(default_factory=list)
