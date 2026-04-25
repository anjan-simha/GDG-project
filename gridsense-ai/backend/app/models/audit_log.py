from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class AuditAction(str, enum.Enum):
    FLAG_DISMISSED = "FLAG_DISMISSED"
    FLAG_CONFIRMED = "FLAG_CONFIRMED"
    FLAG_REVIEWED = "FLAG_REVIEWED"
    THRESHOLD_UPDATED = "THRESHOLD_UPDATED"
    FORECAST_RUN = "FORECAST_RUN"
    ANOMALY_SCAN_RUN = "ANOMALY_SCAN_RUN"
    DATA_EXPORTED = "DATA_EXPORTED"

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    action = Column(SQLEnum(AuditAction), nullable=False)
    flag_id = Column(String, ForeignKey("anomaly_flags.id"), nullable=True)
    zone_id = Column(String, nullable=True)
    operator_note = Column(Text, nullable=True)
    reason_code = Column(String, nullable=True)
    metadata_json = Column(Text, nullable=True)          # JSON string for extra context

    flag = relationship("AnomalyFlag", back_populates="audit_entries")
