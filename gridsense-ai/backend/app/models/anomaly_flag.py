from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class AnomalyType(str, enum.Enum):
    SUDDEN_DROP = "SUDDEN_DROP"
    SUDDEN_SPIKE = "SUDDEN_SPIKE"
    CONSISTENT_UNDERREPORT = "CONSISTENT_UNDERREPORT"
    NIGHT_USAGE_ANOMALY = "NIGHT_USAGE_ANOMALY"
    PEER_DEVIATION = "PEER_DEVIATION"
    TAMPER_SUSPECTED = "TAMPER_SUSPECTED"

class AnomalyStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    DISMISSED = "DISMISSED"
    CONFIRMED = "CONFIRMED"

class FalsePositiveRisk(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class AnomalyFlag(Base):
    __tablename__ = "anomaly_flags"

    id = Column(String, primary_key=True)
    meter_id = Column(String, ForeignKey("meters.id"), nullable=False, index=True)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False, index=True)
    detected_at = Column(DateTime(timezone=True), nullable=False)
    anomaly_type = Column(SQLEnum(AnomalyType), nullable=False)
    severity_score = Column(Float, nullable=False)            # 0–100
    explanation = Column(Text, nullable=False)                # Human-readable reason
    contributing_features = Column(JSON, nullable=False)      # List[str]
    baseline_deviation_pct = Column(Float, nullable=False)    # Signed %
    false_positive_risk = Column(SQLEnum(FalsePositiveRisk), nullable=False)
    status = Column(SQLEnum(AnomalyStatus), default=AnomalyStatus.OPEN)
    dismissed_reason = Column(String, nullable=True)
    dismissed_notes = Column(Text, nullable=True)
    dismissed_at = Column(DateTime(timezone=True), nullable=True)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    is_synthetic = Column(Boolean, default=True)

    meter = relationship("Meter", back_populates="anomaly_flags")
    zone = relationship("Zone", back_populates="anomaly_flags")
    audit_entries = relationship("AuditLog", back_populates="flag")
