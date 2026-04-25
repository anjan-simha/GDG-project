from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.zone import RiskLevel

class ZoneBase(BaseModel):
    name: str
    region: str
    base_kwh_min: float
    base_kwh_max: float

class ZoneCreate(ZoneBase):
    id: str

class ZoneResponse(ZoneBase):
    id: str
    current_load_kwh: Optional[float]
    risk_level: RiskLevel
    active_meter_count: int
    last_updated: Optional[datetime]

    class Config:
        from_attributes = True

class ZoneSummary(BaseModel):
    id: str
    name: str
    risk_level: RiskLevel
    current_load_kwh: Optional[float]
    trend: str = "stable"  # Mock field for sparklines

    class Config:
        from_attributes = True
