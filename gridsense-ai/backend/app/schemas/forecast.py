from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.zone import RiskLevel

class ForecastResponse(BaseModel):
    id: str
    zone_id: str
    forecast_timestamp: datetime
    generated_at: datetime
    predicted_kwh: float
    confidence_low: float
    confidence_high: float
    actual_kwh: Optional[float]
    baseline_kwh: float
    risk_level: RiskLevel
    risk_reason: Optional[str]
    mae: Optional[float]

    class Config:
        from_attributes = True
