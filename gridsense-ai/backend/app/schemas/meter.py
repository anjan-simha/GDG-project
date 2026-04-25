from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.meter import MeterStatus

class MeterBase(BaseModel):
    zone_id: str
    consumer_type: str

class MeterCreate(MeterBase):
    id: str

class MeterResponse(MeterBase):
    id: str
    status: MeterStatus
    installed_at: Optional[datetime]
    last_reading_at: Optional[datetime]
    is_synthetic: bool

    class Config:
        from_attributes = True

class MeterReadingResponse(BaseModel):
    id: str
    meter_id: str
    zone_id: str
    timestamp: datetime
    consumption_kwh: float
    voltage_v: Optional[float]
    current_a: Optional[float]
    power_factor: Optional[float]
    baseline_kwh: Optional[float]
    peer_avg_kwh: Optional[float]

    class Config:
        from_attributes = True
