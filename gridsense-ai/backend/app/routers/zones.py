from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models.zone import Zone
from app.models.meter import Meter
from app.models.meter_reading import MeterReading
from app.models.anomaly_flag import AnomalyFlag
from app.models.demand_forecast import DemandForecast
from app.schemas.zone import ZoneResponse
from app.schemas.meter import MeterResponse, MeterReadingResponse
from app.schemas.forecast import ForecastResponse
from app.schemas.anomaly import AnomalyFlagResponse

router = APIRouter()

@router.get("/", response_model=List[ZoneResponse])
def get_zones(db: Session = Depends(get_db)):
    return db.query(Zone).all()

@router.get("/{zone_id}", response_model=ZoneResponse)
def get_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone

@router.get("/{zone_id}/meters", response_model=List[MeterResponse])
def get_zone_meters(zone_id: str, db: Session = Depends(get_db)):
    return db.query(Meter).filter(Meter.zone_id == zone_id).all()

@router.get("/{zone_id}/readings", response_model=List[MeterReadingResponse])
def get_zone_readings(zone_id: str, start: Optional[datetime] = None, end: Optional[datetime] = None, interval: Optional[str] = "15m", db: Session = Depends(get_db)):
    query = db.query(MeterReading).filter(MeterReading.zone_id == zone_id)
    if start:
        query = query.filter(MeterReading.timestamp >= start)
    if end:
        query = query.filter(MeterReading.timestamp <= end)
    return query.order_by(MeterReading.timestamp).all()

@router.get("/{zone_id}/forecasts", response_model=List[ForecastResponse])
def get_zone_forecasts(zone_id: str, horizon: str = "24h", db: Session = Depends(get_db)):
    now = datetime.utcnow()
    hours = int(horizon.replace("h", "")) if horizon.endswith("h") else 24
    end_time = now + timedelta(hours=hours)
    
    return db.query(DemandForecast).filter(
        DemandForecast.zone_id == zone_id,
        DemandForecast.forecast_timestamp >= now,
        DemandForecast.forecast_timestamp <= end_time
    ).order_by(DemandForecast.forecast_timestamp).all()

@router.get("/{zone_id}/anomalies", response_model=List[AnomalyFlagResponse])
def get_zone_anomalies(zone_id: str, db: Session = Depends(get_db)):
    return db.query(AnomalyFlag).filter(AnomalyFlag.zone_id == zone_id).order_by(AnomalyFlag.detected_at.desc()).all()

@router.get("/{zone_id}/risk-history")
def get_zone_risk_history(zone_id: str, db: Session = Depends(get_db)):
    # Mocking risk history since we don't have a dedicated table for it. 
    # Can derive from past forecasts or audit logs.
    return []

