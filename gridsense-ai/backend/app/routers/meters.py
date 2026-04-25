from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.meter import Meter
from app.models.meter_reading import MeterReading
from app.models.anomaly_flag import AnomalyFlag
from app.schemas.meter import MeterResponse, MeterReadingResponse
from app.schemas.anomaly import AnomalyFlagResponse

router = APIRouter()

@router.get("/{meter_id}", response_model=MeterResponse)
def get_meter(meter_id: str, db: Session = Depends(get_db)):
    meter = db.query(Meter).filter(Meter.id == meter_id).first()
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")
    return meter

@router.get("/{meter_id}/readings", response_model=List[MeterReadingResponse])
def get_meter_readings(
    meter_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=1000),
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MeterReading).filter(MeterReading.meter_id == meter_id)
    if start:
        query = query.filter(MeterReading.timestamp >= start)
    if end:
        query = query.filter(MeterReading.timestamp <= end)
    
    return query.order_by(MeterReading.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()

@router.get("/{meter_id}/anomalies", response_model=List[AnomalyFlagResponse])
def get_meter_anomalies(meter_id: str, db: Session = Depends(get_db)):
    return db.query(AnomalyFlag).filter(AnomalyFlag.meter_id == meter_id).order_by(AnomalyFlag.detected_at.desc()).all()

@router.get("/{meter_id}/baseline")
def get_meter_baseline(meter_id: str, db: Session = Depends(get_db)):
    # Returns the precomputed 7-day baseline per slot
    # We'll just return the baseline_kwh from the last 96 readings for this meter
    readings = db.query(MeterReading).filter(MeterReading.meter_id == meter_id)\
                 .order_by(MeterReading.timestamp.desc()).limit(96).all()
    # Reverse to chronological order
    readings.reverse()
    
    return [
        {
            "timestamp": r.timestamp,
            "baseline_kwh": r.baseline_kwh
        }
        for r in readings
    ]

