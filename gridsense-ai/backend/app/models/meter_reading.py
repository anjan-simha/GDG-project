from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base

class MeterReading(Base):
    __tablename__ = "meter_readings"

    id = Column(String, primary_key=True)
    meter_id = Column(String, ForeignKey("meters.id"), nullable=False, index=True)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    consumption_kwh = Column(Float, nullable=False)
    voltage_v = Column(Float, nullable=True)
    current_a = Column(Float, nullable=True)
    power_factor = Column(Float, nullable=True)
    is_synthetic = Column(Boolean, default=True)
    baseline_kwh = Column(Float, nullable=True)    # 7-day rolling average
    peer_avg_kwh = Column(Float, nullable=True)    # Zone peer average for same slot

    meter = relationship("Meter", back_populates="readings")

    __table_args__ = (
        Index("idx_readings_meter_time", "meter_id", "timestamp"),
        Index("idx_readings_zone_time", "zone_id", "timestamp"),
    )
