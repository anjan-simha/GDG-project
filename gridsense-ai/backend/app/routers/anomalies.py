from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
from app.database import get_db
from app.models.anomaly_flag import AnomalyFlag, AnomalyStatus
from app.models.audit_log import AuditLog, AuditAction
from app.models.meter import Meter
from app.models.meter_reading import MeterReading
from app.schemas.anomaly import AnomalyFlagResponse, DismissRequest
from app.services.anomaly_detector import run_all_detectors
from app.config import get_thresholds
from sqlalchemy import func

router = APIRouter()

@router.get("/", response_model=List[AnomalyFlagResponse])
def get_anomalies(
    status: Optional[AnomalyStatus] = None,
    anomaly_type: Optional[str] = None,
    zone_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AnomalyFlag)
    if status:
        query = query.filter(AnomalyFlag.status == status)
    if anomaly_type:
        query = query.filter(AnomalyFlag.anomaly_type == anomaly_type)
    if zone_id:
        query = query.filter(AnomalyFlag.zone_id == zone_id)
        
    return query.order_by(AnomalyFlag.detected_at.desc()).offset((page - 1) * limit).limit(limit).all()

@router.get("/stats")
def get_anomaly_stats(db: Session = Depends(get_db)):
    # Mock some stats or calculate from DB
    type_counts = db.query(AnomalyFlag.anomaly_type, func.count(AnomalyFlag.id)).group_by(AnomalyFlag.anomaly_type).all()
    status_counts = db.query(AnomalyFlag.status, func.count(AnomalyFlag.id)).group_by(AnomalyFlag.status).all()
    
    return {
        "by_type": {str(k.value): v for k, v in type_counts},
        "by_status": {str(k.value): v for k, v in status_counts}
    }

@router.get("/{flag_id}", response_model=AnomalyFlagResponse)
def get_anomaly(flag_id: str, db: Session = Depends(get_db)):
    flag = db.query(AnomalyFlag).filter(AnomalyFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    return flag

@router.patch("/{flag_id}/dismiss", response_model=AnomalyFlagResponse)
def dismiss_flag(flag_id: str, body: DismissRequest, db: Session = Depends(get_db)):
    flag = db.query(AnomalyFlag).filter(AnomalyFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    if flag.status == AnomalyStatus.DISMISSED:
        raise HTTPException(status_code=400, detail="Flag already dismissed")

    flag.status = AnomalyStatus.DISMISSED
    flag.dismissed_reason = body.reason_code
    flag.dismissed_notes = body.notes
    flag.dismissed_at = datetime.utcnow()

    audit = AuditLog(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        action=AuditAction.FLAG_DISMISSED,
        flag_id=flag_id,
        zone_id=flag.zone_id,
        reason_code=body.reason_code,
        operator_note=body.notes,
    )
    db.add(audit)
    db.commit()
    db.refresh(flag)
    return flag

@router.patch("/{flag_id}/confirm", response_model=AnomalyFlagResponse)
def confirm_flag(flag_id: str, db: Session = Depends(get_db)):
    flag = db.query(AnomalyFlag).filter(AnomalyFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")

    flag.status = AnomalyStatus.CONFIRMED
    flag.confirmed_at = datetime.utcnow()

    audit = AuditLog(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        action=AuditAction.FLAG_CONFIRMED,
        flag_id=flag_id,
        zone_id=flag.zone_id,
        operator_note="Flag confirmed by operator"
    )
    db.add(audit)
    db.commit()
    db.refresh(flag)
    return flag

@router.patch("/{flag_id}/review", response_model=AnomalyFlagResponse)
def review_flag(flag_id: str, db: Session = Depends(get_db)):
    flag = db.query(AnomalyFlag).filter(AnomalyFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")

    flag.status = AnomalyStatus.UNDER_REVIEW

    audit = AuditLog(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        action=AuditAction.FLAG_REVIEWED,
        flag_id=flag_id,
        zone_id=flag.zone_id,
        operator_note="Flag placed under review"
    )
    db.add(audit)
    db.commit()
    db.refresh(flag)
    return flag

@router.post("/run-scan")
def run_anomaly_scan(db: Session = Depends(get_db)):
    meters = db.query(Meter).all()
    cfg = get_thresholds()
    new_flags = []
    
    for meter in meters:
        readings = db.query(MeterReading).filter(MeterReading.meter_id == meter.id).order_by(MeterReading.timestamp).all()
        if readings:
            flags = run_all_detectors(meter.id, meter.zone_id, readings, cfg)
            new_flags.extend(flags)
            
    # Check if flags already exist to prevent duplicates
    saved_count = 0
    for flag in new_flags:
        exists = db.query(AnomalyFlag).filter(
            AnomalyFlag.meter_id == flag.meter_id,
            AnomalyFlag.anomaly_type == flag.anomaly_type,
            AnomalyFlag.detected_at == flag.detected_at
        ).first()
        if not exists:
            db.add(flag)
            saved_count += 1
            
    if saved_count > 0:
        audit = AuditLog(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            action=AuditAction.ANOMALY_SCAN_RUN,
            operator_note=f"Manual scan found {saved_count} new anomalies"
        )
        db.add(audit)
        
    db.commit()
    return {"message": f"Scan completed. Found {saved_count} new anomalies.", "count": saved_count}

