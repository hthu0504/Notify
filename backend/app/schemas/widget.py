from pydantic import BaseModel
from typing import Optional, Dict, Any

class WidgetCreate(BaseModel):
    type: str
    title: str
    config: Dict[str, Any] = {}

class WidgetUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    config: Optional[Dict[str, Any]] = None