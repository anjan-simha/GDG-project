from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.zone import Zone
from app.models.meter import Meter, MeterStatus
from app.models.anomaly_flag import AnomalyFlag, AnomalyStatus
from app.models.demand_forecast import DemandForecast
from app.schemas.zone import ZoneSummary
from app.schemas.anomaly import AnomalyFlagResponse
from sqlalchemy import func
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    zone_count = db.query(Zone).count()
    high_risk_count = db.query(Zone).filter(Zone.risk_level.in_(["HIGH", "CRITICAL"])).count()
    open_flags = db.query(AnomalyFlag).filter(AnomalyFlag.status == AnomalyStatus.OPEN).count()
    
    # Mock forecast accuracy for now
    forecast_accuracy = 92.5
    
    return {
        "zone_count": zone_count,
        "high_risk_count": high_risk_count,
        "open_flags": open_flags,
        "forecast_accuracy": forecast_accuracy
    }

@router.get("/zone-grid", response_model=List[ZoneSummary])
def get_zone_grid(db: Session = Depends(get_db)):
    zones = db.query(Zone).all()
    return zones

@router.get("/recent-flags", response_model=List[AnomalyFlagResponse])
def get_recent_flags(db: Session = Depends(get_db)):
    flags = db.query(AnomalyFlag).filter(AnomalyFlag.status == AnomalyStatus.OPEN)\
              .order_by(AnomalyFlag.detected_at.desc()).limit(5).all()
    return flags

@router.get("/system-status")
def get_system_status(db: Session = Depends(get_db)):
    meter_count = db.query(Meter).count()
    return {
        "meter_count": meter_count,
        "last_sync_time": datetime.utcnow().isoformat(),
        "data_freshness": "99%"
    }
