from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class MeterStatus(str, enum.Enum):
    NORMAL = "NORMAL"
    FLAGGED = "FLAGGED"
    SUSPECTED = "SUSPECTED"
    CONFIRMED_TAMPER = "CONFIRMED_TAMPER"
    OFFLINE = "OFFLINE"

class Meter(Base):
    __tablename__ = "meters"

    id = Column(String, primary_key=True)          # e.g. BLR-N01-M01
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False)
    consumer_type = Column(String, default="RESIDENTIAL")  # RESIDENTIAL / COMMERCIAL / INDUSTRIAL
    status = Column(SQLEnum(MeterStatus), default=MeterStatus.NORMAL)
    installed_at = Column(DateTime(timezone=True))
    last_reading_at = Column(DateTime(timezone=True))
    is_synthetic = Column(Boolean, default=True)

    zone = relationship("Zone", back_populates="meters")
    readings = relationship("MeterReading", back_populates="meter")
    anomaly_flags = relationship("AnomalyFlag", back_populates="meter")
