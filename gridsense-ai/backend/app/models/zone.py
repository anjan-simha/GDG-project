from sqlalchemy import Column, String, Float, Integer, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Zone(Base):
    __tablename__ = "zones"

    id = Column(String, primary_key=True)          # e.g. BLR-N01
    name = Column(String, nullable=False)           # e.g. Rajajinagar
    region = Column(String, nullable=False)         # N / S / E / W / C
    base_kwh_min = Column(Float, nullable=False)
    base_kwh_max = Column(Float, nullable=False)
    current_load_kwh = Column(Float, nullable=True)
    risk_level = Column(SQLEnum(RiskLevel), default=RiskLevel.LOW)
    active_meter_count = Column(Integer, default=0)
    last_updated = Column(DateTime(timezone=True), nullable=True)

    meters = relationship("Meter", back_populates="zone")
    forecasts = relationship("DemandForecast", back_populates="zone")
    anomaly_flags = relationship("AnomalyFlag", back_populates="zone")
