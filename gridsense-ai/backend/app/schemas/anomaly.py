from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.anomaly_flag import AnomalyType, AnomalyStatus, FalsePositiveRisk

class AnomalyFlagResponse(BaseModel):
    id: str
    meter_id: str
    zone_id: str
    detected_at: datetime
    anomaly_type: AnomalyType
    severity_score: float
    explanation: str
    contributing_features: List[str]
    baseline_deviation_pct: float
    false_positive_risk: FalsePositiveRisk
    status: AnomalyStatus
    dismissed_reason: Optional[str]
    dismissed_notes: Optional[str]
    dismissed_at: Optional[datetime]
    confirmed_at: Optional[datetime]
    is_synthetic: bool

    class Config:
        from_attributes = True

class DismissRequest(BaseModel):
    reason_code: str
    notes: Optional[str] = None
