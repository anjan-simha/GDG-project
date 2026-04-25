from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import csv
import io
from app.database import get_db
from app.models.audit_log import AuditLog, AuditAction
from app.schemas.audit import AuditLogResponse

router = APIRouter()

@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[AuditAction] = None,
    zone_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    
    if action:
        query = query.filter(AuditLog.action == action)
    if zone_id:
        query = query.filter(AuditLog.zone_id == zone_id)
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)
        
    return query.order_by(AuditLog.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()

@router.get("/flag/{flag_id}", response_model=List[AuditLogResponse])
def get_audit_by_flag(flag_id: str, db: Session = Depends(get_db)):
    return db.query(AuditLog).filter(AuditLog.flag_id == flag_id).order_by(AuditLog.timestamp.desc()).all()

@router.get("/export")
def export_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['ID', 'Timestamp', 'Action', 'Flag ID', 'Zone ID', 'Reason Code', 'Operator Note'])
    
    # Write rows
    for log in logs:
        writer.writerow([
            log.id,
            log.timestamp.isoformat(),
            log.action.value,
            log.flag_id,
            log.zone_id,
            log.reason_code,
            log.operator_note
        ])
        
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_log_export.csv"}
    )

