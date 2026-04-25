from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.audit_log import AuditAction

class AuditLogResponse(BaseModel):
    id: str
    timestamp: datetime
    action: AuditAction
    flag_id: Optional[str]
    zone_id: Optional[str]
    operator_note: Optional[str]
    reason_code: Optional[str]
    metadata_json: Optional[str]

    class Config:
        from_attributes = True
