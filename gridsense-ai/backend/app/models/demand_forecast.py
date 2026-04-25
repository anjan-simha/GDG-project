from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.zone import RiskLevel

class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    id = Column(String, primary_key=True)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False, index=True)
    forecast_timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    generated_at = Column(DateTime(timezone=True), nullable=False)
    predicted_kwh = Column(Float, nullable=False)
    confidence_low = Column(Float, nullable=False)
    confidence_high = Column(Float, nullable=False)
    actual_kwh = Column(Float, nullable=True)         # Filled in as actuals arrive
    baseline_kwh = Column(Float, nullable=False)
    risk_level = Column(SQLEnum(RiskLevel), nullable=False)
    risk_reason = Column(Text, nullable=True)          # Explainability string
    mae = Column(Float, nullable=True)                 # Filled after actual arrives

    zone = relationship("Zone", back_populates="forecasts")
