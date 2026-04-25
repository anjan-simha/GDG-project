# GridSense AI — Full-Stack Master Build Prompt
## Antigravity IDE · React + TypeScript (Frontend) · FastAPI + PostgreSQL (Backend)
## Version 2.0 — Full Backend & Database Integration

---

## 🧭 What This Prompt Covers

This is the **master build prompt** for GridSense AI, the BESCOM Smart Meter Intelligence & Loss Detection platform. It encompasses:

1. **Frontend Polish** — Completing and refining the existing React + TypeScript UI
2. **Backend API** — A FastAPI Python server with all endpoints the frontend needs
3. **Database Layer** — PostgreSQL schema with migrations, seed data, and ORM models
4. **Full Integration** — Connecting frontend ↔ backend ↔ database end-to-end
5. **AI/ML Engine** — Demand forecasting and anomaly detection algorithms running server-side
6. **Audit & Explainability** — Persistent, queryable audit log for all operator actions

Refer to:
- `gemini.md` — agent behavior rules, data schemas, coding conventions
- `brand-guidelines.md` — all visual, color, font, and animation decisions
- `skills/` — skill files for each repeatable engineering task

---

## 🏗️ Final Project Structure

```
gridsense-ai/
├── frontend/                        # React + TypeScript (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── TopBar.tsx
│   │   │   │   └── PageWrapper.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── ZoneRiskGrid.tsx
│   │   │   │   └── SystemStatusBar.tsx
│   │   │   ├── forecasting/
│   │   │   │   ├── DemandForecastChart.tsx
│   │   │   │   ├── ZoneRiskMap.tsx
│   │   │   │   └── ForecastTable.tsx
│   │   │   ├── anomalies/
│   │   │   │   ├── AnomalyFlagCard.tsx
│   │   │   │   ├── AnomalyTimeline.tsx
│   │   │   │   ├── DismissModal.tsx
│   │   │   │   └── AnomalyFilters.tsx
│   │   │   └── shared/
│   │   │       ├── StatusBadge.tsx
│   │   │       ├── RiskIndicator.tsx
│   │   │       ├── SkeletonLoader.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       ├── ExplainabilityTooltip.tsx
│   │   │       └── Toast.tsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ForecastingPage.tsx
│   │   │   ├── AnomalyPage.tsx
│   │   │   ├── ZoneDetailPage.tsx
│   │   │   ├── MeterDetailPage.tsx
│   │   │   ├── AuditLogPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── hooks/
│   │   │   ├── useZones.ts
│   │   │   ├── useForecasts.ts
│   │   │   ├── useAnomalies.ts
│   │   │   ├── useMeterReadings.ts
│   │   │   ├── useAuditLog.ts
│   │   │   └── useWebSocket.ts
│   │   ├── services/
│   │   │   ├── api.ts               # Axios instance + interceptors
│   │   │   ├── zoneService.ts
│   │   │   ├── forecastService.ts
│   │   │   ├── anomalyService.ts
│   │   │   ├── meterService.ts
│   │   │   └── auditService.ts
│   │   ├── types/
│   │   │   ├── meter.ts
│   │   │   ├── api.ts               # API request/response types
│   │   │   └── store.ts
│   │   ├── store/
│   │   │   └── useAppStore.ts       # Zustand global state
│   │   ├── constants/
│   │   │   ├── zones.ts
│   │   │   ├── thresholds.ts
│   │   │   └── config.ts
│   │   └── utils/
│   │       ├── formatters.ts
│   │       └── chartHelpers.ts
│   ├── .env                         # VITE_API_BASE_URL=http://localhost:8000
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                         # FastAPI Python server
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry point
│   │   ├── config.py                # Settings via pydantic-settings
│   │   ├── database.py              # SQLAlchemy engine + session factory
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── zone.py
│   │   │   ├── meter.py
│   │   │   ├── meter_reading.py
│   │   │   ├── anomaly_flag.py
│   │   │   ├── demand_forecast.py
│   │   │   └── audit_log.py
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── zone.py
│   │   │   ├── meter.py
│   │   │   ├── forecast.py
│   │   │   ├── anomaly.py
│   │   │   └── audit.py
│   │   ├── routers/                 # FastAPI route handlers
│   │   │   ├── __init__.py
│   │   │   ├── zones.py
│   │   │   ├── meters.py
│   │   │   ├── forecasts.py
│   │   │   ├── anomalies.py
│   │   │   ├── dashboard.py
│   │   │   └── audit.py
│   │   ├── services/                # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── demand_forecaster.py
│   │   │   ├── anomaly_detector.py
│   │   │   ├── risk_classifier.py
│   │   │   └── explainability.py
│   │   ├── ml/                      # ML models and algorithms
│   │   │   ├── __init__.py
│   │   │   ├── forecasting_model.py
│   │   │   ├── anomaly_models.py
│   │   │   └── baseline_calculator.py
│   │   └── seed/
│   │       ├── __init__.py
│   │       └── seed_data.py         # Synthetic data generator + DB seeder
│   ├── alembic/                     # Database migrations
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   ├── tests/
│   │   ├── test_forecasting.py
│   │   ├── test_anomaly_detection.py
│   │   └── test_api.py
│   ├── .env                         # DATABASE_URL, SECRET_KEY, etc.
│   ├── alembic.ini
│   └── requirements.txt
│
├── docker-compose.yml               # PostgreSQL + backend + frontend
├── README.md
└── skills/
    ├── demand-forecasting/SKILL.md
    ├── anomaly-detection/SKILL.md
    ├── synthetic-data-gen/SKILL.md
    ├── zone-risk-classification/SKILL.md
    └── explainability-layer/SKILL.md
```

---

## 🐘 TASK 1 — Database Schema (PostgreSQL + SQLAlchemy)

### 1.1 Install Backend Dependencies

```bash
cd backend
pip install fastapi uvicorn sqlalchemy psycopg2-binary alembic pydantic-settings \
            python-dotenv pandas numpy scikit-learn scipy statsmodels httpx pytest \
            pytest-asyncio websockets python-multipart
```

### 1.2 Environment Configuration (`backend/.env`)

```env
DATABASE_URL=postgresql://gridsense:gridsense@localhost:5432/gridsense_db
SECRET_KEY=gridsense-bescom-dev-key-change-in-prod
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173
LOG_LEVEL=INFO
SYNTHETIC_DATA_BANNER=true
```

### 1.3 Docker Compose for PostgreSQL (`docker-compose.yml`)

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:15-alpine
    container_name: gridsense_postgres
    environment:
      POSTGRES_USER: gridsense
      POSTGRES_PASSWORD: gridsense
      POSTGRES_DB: gridsense_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gridsense"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    container_name: gridsense_backend
    environment:
      DATABASE_URL: postgresql://gridsense:gridsense@postgres:5432/gridsense_db
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

volumes:
  pgdata:
```

### 1.4 SQLAlchemy ORM Models

**`backend/app/models/zone.py`**
```python
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
```

**`backend/app/models/meter.py`**
```python
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
```

**`backend/app/models/meter_reading.py`**
```python
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
```

**`backend/app/models/anomaly_flag.py`**
```python
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
```

**`backend/app/models/demand_forecast.py`**
```python
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
```

**`backend/app/models/audit_log.py`**
```python
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
```

### 1.5 Alembic Migration

Run after creating all models:
```bash
cd backend
alembic init alembic
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
```

---

## ⚙️ TASK 2 — Backend Services (Business Logic)

### 2.1 Demand Forecasting Service (`backend/app/services/demand_forecaster.py`)

```python
"""
Demand Forecasting Service
Method: Seasonal naive decomposition with time-of-day and day-of-week multipliers.
Intentionally kept explainable — no black-box deep learning.
[SYNTHETIC DATA] — uses synthetic meter readings only.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.meter_reading import MeterReading
from app.models.demand_forecast import DemandForecast
from app.models.zone import Zone, RiskLevel
from app.schemas.forecast import ForecastResponse

# Time-of-day demand multipliers (applied to base zone capacity)
TIME_OF_DAY_MULTIPLIERS = {
    range(0, 5):   0.45,   # 12am–4:59am  — off-peak night
    range(5, 7):   0.70,   # 5am–6:59am   — early morning ramp
    range(7, 10):  1.40,   # 7am–9:59am   — morning peak
    range(10, 17): 1.10,   # 10am–4:59pm  — midday sustained
    range(17, 22): 1.65,   # 5pm–9:59pm   — evening peak (highest)
    range(22, 24): 0.80,   # 10pm–11:59pm — evening wind-down
}

DAY_OF_WEEK_MULTIPLIERS = {
    0: 1.05,  # Monday
    1: 1.05,  # Tuesday
    2: 1.00,  # Wednesday
    3: 1.00,  # Thursday
    4: 1.10,  # Friday
    5: 0.90,  # Saturday
    6: 0.80,  # Sunday
}

def get_tod_multiplier(hour: int) -> float:
    for hour_range, multiplier in TIME_OF_DAY_MULTIPLIERS.items():
        if hour in hour_range:
            return multiplier
    return 1.0

def calculate_rolling_baseline(
    readings: List[MeterReading],
    interval_slot: int,   # 0–95 (15-min slot in day)
    lookback_days: int = 7
) -> float:
    """
    Calculate 7-day rolling average for a given 15-minute slot.
    Returns the baseline kWh for that slot.
    """
    slot_readings = [
        r.consumption_kwh for r in readings
        if (r.timestamp.hour * 4 + r.timestamp.minute // 15) == interval_slot
    ]
    if not slot_readings:
        return 0.0
    return float(np.mean(slot_readings[-lookback_days * 1:]))  # 1 reading per slot per day

def generate_zone_forecast(
    db: Session,
    zone: Zone,
    horizon_hours: int = 24,
    noise_pct: float = 0.05
) -> List[DemandForecast]:
    """
    Generate demand forecasts for a zone over the specified horizon.
    Returns a list of DemandForecast objects (not yet committed to DB).
    Each forecast is explainable: stores risk_reason string.
    """
    now = datetime.utcnow().replace(second=0, microsecond=0)
    # Round to nearest 15-min
    minutes = (now.minute // 15) * 15
    start = now.replace(minute=minutes) + timedelta(minutes=15)

    # Pull last 7 days of readings for this zone to compute baselines
    seven_days_ago = now - timedelta(days=7)
    readings = db.query(MeterReading).filter(
        MeterReading.zone_id == zone.id,
        MeterReading.timestamp >= seven_days_ago
    ).all()

    forecasts = []
    intervals = horizon_hours * 4  # 15-min intervals

    for i in range(intervals):
        ts = start + timedelta(minutes=15 * i)
        hour = ts.hour
        dow = ts.weekday()
        slot = hour * 4 + ts.minute // 15

        tod_mult = get_tod_multiplier(hour)
        dow_mult = DAY_OF_WEEK_MULTIPLIERS[dow]

        # Base = midpoint of zone capacity range
        base = (zone.base_kwh_min + zone.base_kwh_max) / 2
        predicted = base * tod_mult * dow_mult

        # Add Gaussian noise
        noise = np.random.normal(0, predicted * noise_pct)
        predicted = max(0, predicted + noise)

        # Confidence interval: ±10%
        conf_low = predicted * 0.90
        conf_high = predicted * 1.10

        # Baseline from historical slot average
        baseline = calculate_rolling_baseline(readings, slot)
        if baseline == 0.0:
            baseline = base * tod_mult  # Fallback if no history

        # Risk classification
        from app.config import get_thresholds
        thresholds = get_thresholds()
        if predicted > thresholds.critical_kwh:
            risk = RiskLevel.CRITICAL
            risk_reason = (
                f"Zone {zone.name} forecast to exceed critical threshold of "
                f"{thresholds.critical_kwh} kWh at {ts.strftime('%H:%M on %d %b')}. "
                f"Historical 7-day average for this slot: {baseline:.1f} kWh."
            )
        elif predicted > thresholds.high_kwh:
            risk = RiskLevel.HIGH
            risk_reason = (
                f"Zone {zone.name} forecast above high-risk threshold of "
                f"{thresholds.high_kwh} kWh. Predicted: {predicted:.1f} kWh "
                f"vs baseline {baseline:.1f} kWh."
            )
        elif predicted > thresholds.moderate_kwh:
            risk = RiskLevel.MODERATE
            risk_reason = f"Zone {zone.name} approaching moderate load threshold."
        else:
            risk = RiskLevel.LOW
            risk_reason = None

        forecast = DemandForecast(
            id=f"{zone.id}-{ts.strftime('%Y%m%d%H%M')}",
            zone_id=zone.id,
            forecast_timestamp=ts,
            generated_at=now,
            predicted_kwh=round(predicted, 2),
            confidence_low=round(conf_low, 2),
            confidence_high=round(conf_high, 2),
            baseline_kwh=round(baseline, 2),
            risk_level=risk,
            risk_reason=risk_reason,
        )
        forecasts.append(forecast)

    return forecasts
```

### 2.2 Anomaly Detection Service (`backend/app/services/anomaly_detector.py`)

```python
"""
Anomaly Detection Service
All detectors are pure functions returning AnomalyFlag | None.
Method: Rule-based thresholds + Z-score statistics. Fully explainable.
[SYNTHETIC DATA] — operates on synthetic readings.
"""

import uuid
import numpy as np
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from app.models.meter_reading import MeterReading
from app.models.anomaly_flag import AnomalyFlag, AnomalyType, AnomalyStatus, FalsePositiveRisk
from app.config import ThresholdConfig

def _severity(deviation_pct: float, max_deviation: float = 100.0) -> float:
    """Map deviation percentage to a 0–100 severity score."""
    return min(100.0, abs(deviation_pct) / max_deviation * 100)

def _fp_risk(methods_triggered: int) -> FalsePositiveRisk:
    """Estimate false-positive risk based on how many methods agree."""
    if methods_triggered >= 2:
        return FalsePositiveRisk.LOW
    return FalsePositiveRisk.HIGH

def detect_sudden_drop(
    meter_id: str,
    zone_id: str,
    readings: List[MeterReading],
    cfg: ThresholdConfig
) -> Optional[AnomalyFlag]:
    """
    Flag if consecutive readings fall >DROP_THRESHOLD% below the 7-day baseline.
    """
    if len(readings) < cfg.consecutive_intervals_for_flag:
        return None

    recent = readings[-cfg.consecutive_intervals_for_flag:]
    baselines = [r.baseline_kwh for r in recent if r.baseline_kwh and r.baseline_kwh > 0]
    if not baselines:
        return None

    avg_baseline = np.mean(baselines)
    avg_recent = np.mean([r.consumption_kwh for r in recent])
    deviation_pct = ((avg_recent - avg_baseline) / avg_baseline) * 100

    if deviation_pct < -(cfg.drop_threshold * 100):
        start_ts = recent[0].timestamp
        end_ts = recent[-1].timestamp
        return AnomalyFlag(
            id=str(uuid.uuid4()),
            meter_id=meter_id,
            zone_id=zone_id,
            detected_at=datetime.utcnow(),
            anomaly_type=AnomalyType.SUDDEN_DROP,
            severity_score=_severity(abs(deviation_pct)),
            explanation=(
                f"Meter {meter_id} in zone {zone_id}: Consumption dropped "
                f"{abs(deviation_pct):.1f}% below the 7-day baseline average "
                f"({avg_baseline:.1f} kWh) over {cfg.consecutive_intervals_for_flag} "
                f"consecutive 15-minute intervals from "
                f"{start_ts.strftime('%H:%M')} to {end_ts.strftime('%H:%M on %d %b %Y')}."
            ),
            contributing_features=["Consecutive Drop", "Baseline Deviation", "7-day Average"],
            baseline_deviation_pct=round(deviation_pct, 2),
            false_positive_risk=_fp_risk(1),
            status=AnomalyStatus.OPEN,
        )
    return None

def detect_sudden_spike(
    meter_id: str,
    zone_id: str,
    readings: List[MeterReading],
    cfg: ThresholdConfig
) -> Optional[AnomalyFlag]:
    """
    Flag if recent readings spike >SPIKE_THRESHOLD% above baseline.
    """
    if len(readings) < cfg.consecutive_intervals_for_flag:
        return None

    recent = readings[-cfg.consecutive_intervals_for_flag:]
    baselines = [r.baseline_kwh for r in recent if r.baseline_kwh and r.baseline_kwh > 0]
    if not baselines:
        return None

    avg_baseline = np.mean(baselines)
    avg_recent = np.mean([r.consumption_kwh for r in recent])
    deviation_pct = ((avg_recent - avg_baseline) / avg_baseline) * 100

    if deviation_pct > (cfg.spike_threshold * 100):
        return AnomalyFlag(
            id=str(uuid.uuid4()),
            meter_id=meter_id,
            zone_id=zone_id,
            detected_at=datetime.utcnow(),
            anomaly_type=AnomalyType.SUDDEN_SPIKE,
            severity_score=_severity(deviation_pct),
            explanation=(
                f"Meter {meter_id}: Consumption spiked {deviation_pct:.1f}% above "
                f"the 7-day baseline ({avg_baseline:.1f} kWh). This may indicate "
                f"unauthorized load addition or meter irregularity."
            ),
            contributing_features=["Spike Event", "Baseline Deviation", "Short Window"],
            baseline_deviation_pct=round(deviation_pct, 2),
            false_positive_risk=_fp_risk(1),
            status=AnomalyStatus.OPEN,
        )
    return None

def detect_peer_deviation(
    meter_id: str,
    zone_id: str,
    readings: List[MeterReading],
    cfg: ThresholdConfig
) -> Optional[AnomalyFlag]:
    """
    Flag if meter's consumption deviates >PEER_ZSCORE_THRESHOLD standard deviations
    from the zone peer average for the same time slots.
    """
    peer_avgs = [r.peer_avg_kwh for r in readings[-96:] if r.peer_avg_kwh]
    consumptions = [r.consumption_kwh for r in readings[-96:]]

    if len(peer_avgs) < 10:
        return None

    differences = [c - p for c, p in zip(consumptions, peer_avgs)]
    z_score = abs(np.mean(differences)) / (np.std(differences) + 1e-9)

    if z_score > cfg.peer_zscore_threshold:
        avg_deviation_pct = (np.mean(differences) / np.mean(peer_avgs)) * 100
        return AnomalyFlag(
            id=str(uuid.uuid4()),
            meter_id=meter_id,
            zone_id=zone_id,
            detected_at=datetime.utcnow(),
            anomaly_type=AnomalyType.PEER_DEVIATION,
            severity_score=min(100, z_score * 20),
            explanation=(
                f"Meter {meter_id} deviates {avg_deviation_pct:.1f}% from the zone "
                f"peer average (Z-score: {z_score:.2f}, threshold: "
                f"{cfg.peer_zscore_threshold}). Consistently different from "
                f"comparable meters in {zone_id}."
            ),
            contributing_features=["Z-score Analysis", "Peer Comparison", "96-interval Window"],
            baseline_deviation_pct=round(avg_deviation_pct, 2),
            false_positive_risk=FalsePositiveRisk.MEDIUM,
            status=AnomalyStatus.OPEN,
        )
    return None

def detect_night_usage(
    meter_id: str,
    zone_id: str,
    readings: List[MeterReading],
    cfg: ThresholdConfig
) -> Optional[AnomalyFlag]:
    """
    Flag if 1am–4am usage exceeds 40% of daytime average.
    """
    night_readings = [
        r for r in readings
        if 1 <= r.timestamp.hour <= 4
    ]
    day_readings = [
        r for r in readings
        if 8 <= r.timestamp.hour <= 20
    ]

    if not night_readings or not day_readings:
        return None

    night_avg = np.mean([r.consumption_kwh for r in night_readings])
    day_avg = np.mean([r.consumption_kwh for r in day_readings])

    if day_avg == 0:
        return None

    ratio = night_avg / day_avg
    if ratio > 0.40:
        deviation_pct = (ratio - 0.40) / 0.40 * 100
        return AnomalyFlag(
            id=str(uuid.uuid4()),
            meter_id=meter_id,
            zone_id=zone_id,
            detected_at=datetime.utcnow(),
            anomaly_type=AnomalyType.NIGHT_USAGE_ANOMALY,
            severity_score=_severity(deviation_pct, max_deviation=150),
            explanation=(
                f"Meter {meter_id}: Night-time usage (1am–4am) is {ratio*100:.1f}% "
                f"of daytime average — significantly higher than expected 40% threshold. "
                f"Night avg: {night_avg:.2f} kWh, Day avg: {day_avg:.2f} kWh."
            ),
            contributing_features=["Night Usage Pattern", "Day/Night Ratio", "Time-window Analysis"],
            baseline_deviation_pct=round(deviation_pct, 2),
            false_positive_risk=FalsePositiveRisk.MEDIUM,
            status=AnomalyStatus.OPEN,
        )
    return None

def detect_tamper_pattern(
    meter_id: str,
    zone_id: str,
    drop_flag: Optional[AnomalyFlag],
    underreport_flag: Optional[AnomalyFlag]
) -> Optional[AnomalyFlag]:
    """
    Composite detector: flags TAMPER_SUSPECTED when both SUDDEN_DROP
    and CONSISTENT_UNDERREPORT are triggered for the same meter.
    This is the highest-confidence tamper signal.
    """
    if drop_flag is None or underreport_flag is None:
        return None

    return AnomalyFlag(
        id=str(uuid.uuid4()),
        meter_id=meter_id,
        zone_id=zone_id,
        detected_at=datetime.utcnow(),
        anomaly_type=AnomalyType.TAMPER_SUSPECTED,
        severity_score=min(100, (drop_flag.severity_score + underreport_flag.severity_score) / 2 + 20),
        explanation=(
            f"Meter {meter_id}: Multiple anomaly signals detected simultaneously — "
            f"a sudden consumption drop combined with a pattern of consistent "
            f"underreporting vs. peer group. This combination is a strong indicator "
            f"of potential meter tampering or energy theft. Recommend immediate physical inspection."
        ),
        contributing_features=[
            "Composite Signal",
            "Sudden Drop",
            "Consistent Underreport",
            "Peer Deviation",
            "Multi-method Agreement"
        ],
        baseline_deviation_pct=min(
            drop_flag.baseline_deviation_pct,
            underreport_flag.baseline_deviation_pct
        ),
        false_positive_risk=FalsePositiveRisk.LOW,  # Two methods agree → low FP risk
        status=AnomalyStatus.OPEN,
    )

def run_all_detectors(
    meter_id: str,
    zone_id: str,
    readings: List[MeterReading],
    cfg: ThresholdConfig
) -> List[AnomalyFlag]:
    """
    Run all anomaly detectors on a meter's readings.
    Returns deduplicated list of AnomalyFlag objects.
    """
    flags = []

    drop = detect_sudden_drop(meter_id, zone_id, readings, cfg)
    spike = detect_sudden_spike(meter_id, zone_id, readings, cfg)
    peer = detect_peer_deviation(meter_id, zone_id, readings, cfg)
    night = detect_night_usage(meter_id, zone_id, readings, cfg)
    tamper = detect_tamper_pattern(meter_id, zone_id, drop, peer)

    for flag in [drop, spike, peer, night, tamper]:
        if flag is not None:
            flags.append(flag)

    return flags
```

---

## 🌐 TASK 3 — FastAPI Routers (REST API)

### 3.1 App Entry Point (`backend/app/main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import engine, Base
from app.routers import zones, meters, forecasts, anomalies, dashboard, audit

settings = get_settings()

# Create all tables (use alembic in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GridSense AI API",
    description="BESCOM Smart Meter Intelligence & Loss Detection",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(zones.router,     prefix="/api/zones",     tags=["Zones"])
app.include_router(meters.router,    prefix="/api/meters",    tags=["Meters"])
app.include_router(forecasts.router, prefix="/api/forecasts", tags=["Forecasts"])
app.include_router(anomalies.router, prefix="/api/anomalies", tags=["Anomalies"])
app.include_router(audit.router,     prefix="/api/audit",     tags=["Audit"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "GridSense AI", "synthetic_mode": True}

@app.on_event("startup")
async def startup_event():
    print("\n" + "="*60)
    print("  [GRIDSENSE AI] ⚡ Running on SYNTHETIC data only.")
    print("  No real BESCOM meter data is in use.")
    print("="*60 + "\n")
```

### 3.2 API Endpoint Reference (implement all of these)

#### Dashboard Router (`/api/dashboard`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | KPI cards: zone count, high-risk count, open flags, forecast accuracy |
| GET | `/api/dashboard/zone-grid` | All 12 zones with risk level, current load, sparkline data |
| GET | `/api/dashboard/recent-flags` | Last 5 open anomaly flags |
| GET | `/api/dashboard/system-status` | Meter count, last sync time, data freshness |

#### Zones Router (`/api/zones`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/zones/` | List all zones with current risk level |
| GET | `/api/zones/{zone_id}` | Zone detail with KPIs |
| GET | `/api/zones/{zone_id}/meters` | List all meters in a zone |
| GET | `/api/zones/{zone_id}/readings` | Query params: `start`, `end`, `interval` |
| GET | `/api/zones/{zone_id}/forecasts` | Zone forecasts, query: `horizon=6h|24h|48h` |
| GET | `/api/zones/{zone_id}/anomalies` | Zone anomaly history |
| GET | `/api/zones/{zone_id}/risk-history` | Risk level changes over time |

#### Meters Router (`/api/meters`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/meters/{meter_id}` | Meter detail + status |
| GET | `/api/meters/{meter_id}/readings` | Paginated readings, query: `page`, `limit`, `start`, `end` |
| GET | `/api/meters/{meter_id}/anomalies` | All flags for this meter |
| GET | `/api/meters/{meter_id}/baseline` | Precomputed 7-day baseline per slot |

#### Forecasts Router (`/api/forecasts`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/forecasts/` | All current forecasts, filter by zone/horizon/risk |
| POST | `/api/forecasts/run` | Trigger a new forecast run for all zones |
| GET | `/api/forecasts/accuracy` | MAE metrics for past forecasts vs actuals |

#### Anomalies Router (`/api/anomalies`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/anomalies/` | Paginated flags with filters: type, status, severity, zone |
| GET | `/api/anomalies/{flag_id}` | Single flag detail |
| PATCH | `/api/anomalies/{flag_id}/dismiss` | Body: `{reason_code, notes}` — sets DISMISSED + logs audit |
| PATCH | `/api/anomalies/{flag_id}/confirm` | Sets CONFIRMED + logs audit |
| PATCH | `/api/anomalies/{flag_id}/review` | Sets UNDER_REVIEW + logs audit |
| POST | `/api/anomalies/run-scan` | Trigger anomaly scan across all meters |
| GET | `/api/anomalies/stats` | Count by type, status, zone, severity distribution |

#### Audit Router (`/api/audit`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/audit/` | Paginated audit log — filter by action, zone, date range |
| GET | `/api/audit/flag/{flag_id}` | Full audit trail for a specific flag |
| GET | `/api/audit/export` | CSV export of audit log |

### 3.3 Anomaly Dismiss Endpoint (Full Implementation Example)

```python
# backend/app/routers/anomalies.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.anomaly_flag import AnomalyFlag, AnomalyStatus
from app.models.audit_log import AuditLog, AuditAction
from app.schemas.anomaly import DismissRequest, AnomalyFlagResponse
from datetime import datetime
import uuid

router = APIRouter()

@router.patch("/{flag_id}/dismiss", response_model=AnomalyFlagResponse)
def dismiss_flag(
    flag_id: str,
    body: DismissRequest,
    db: Session = Depends(get_db)
):
    flag = db.query(AnomalyFlag).filter(AnomalyFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    if flag.status == AnomalyStatus.DISMISSED:
        raise HTTPException(status_code=400, detail="Flag already dismissed")

    flag.status = AnomalyStatus.DISMISSED
    flag.dismissed_reason = body.reason_code
    flag.dismissed_notes = body.notes
    flag.dismissed_at = datetime.utcnow()

    # Write audit entry — mandatory for every state change
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
```

---

## 🌱 TASK 4 — Synthetic Data Seeder

**`backend/app/seed/seed_data.py`**

Build a comprehensive seeder that:

1. Creates all 12 zones from the reference table below
2. Creates 4 meters per zone (48 total)
3. Generates 7 days × 96 intervals = 672 readings per meter (32,256 total readings)
4. Calculates and stores `baseline_kwh` (7-day rolling average per slot) on each reading
5. Calculates and stores `peer_avg_kwh` (zone average for same slot) on each reading
6. Injects the following anomalies across specific meters:
   - `BLR-E02-M03`: SUDDEN_DROP for the last 8 intervals
   - `BLR-S03-M01`: SUDDEN_SPIKE for 4 intervals 3 days ago
   - `BLR-W01-M02`: CONSISTENT_UNDERREPORT (20% below peers for full 7 days)
   - `BLR-C01-M04`: NIGHT_USAGE_ANOMALY (heavy 1am–4am usage)
   - `BLR-N01-M01`: PEER_DEVIATION (Z > 2.5)
   - `BLR-E01-M02`: TAMPER_SUSPECTED (drop + underreport combined)
7. Runs `run_all_detectors()` on all meters and saves generated `AnomalyFlag` records
8. Generates 48-hour forecasts for all zones using `generate_zone_forecast()`
9. Is idempotent — safe to run multiple times (`on_conflict_do_nothing`)

**Zone Reference Table:**
```python
ZONES = [
    {"id": "BLR-N01", "name": "Rajajinagar",     "region": "N", "base": (80, 120)},
    {"id": "BLR-N02", "name": "Malleshwaram",    "region": "N", "base": (60, 95)},
    {"id": "BLR-E01", "name": "Indiranagar",     "region": "E", "base": (100, 160)},
    {"id": "BLR-E02", "name": "Whitefield",      "region": "E", "base": (140, 220)},
    {"id": "BLR-E03", "name": "Marathahalli",    "region": "E", "base": (90, 140)},
    {"id": "BLR-S01", "name": "Jayanagar",       "region": "S", "base": (75, 115)},
    {"id": "BLR-S02", "name": "BTM Layout",      "region": "S", "base": (85, 130)},
    {"id": "BLR-S03", "name": "Electronic City", "region": "S", "base": (200, 350)},
    {"id": "BLR-W01", "name": "Vijayanagar",     "region": "W", "base": (70, 110)},
    {"id": "BLR-W02", "name": "Nagarbhavi",      "region": "W", "base": (55, 85)},
    {"id": "BLR-C01", "name": "Shivajinagar",    "region": "C", "base": (120, 180)},
    {"id": "BLR-C02", "name": "Ulsoor",          "region": "C", "base": (95, 145)},
]
```

Run the seeder via:
```bash
cd backend
python -m app.seed.seed_data
```

---

## 🔌 TASK 5 — Frontend API Integration

### 5.1 Axios API Client (`frontend/src/services/api.ts`)

```typescript
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — log in dev
api.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.debug(`[GridSense API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Response interceptor — normalize errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail ?? err.message ?? 'Unknown API error';
    console.error(`[GridSense API Error]`, msg);
    return Promise.reject(new Error(msg));
  }
);
```

### 5.2 Service Modules (implement each)

**`frontend/src/services/anomalyService.ts`**
```typescript
import { api } from './api';
import { AnomalyFlag, AnomalyFilters, DismissPayload } from '../types/meter';

export const anomalyService = {
  getAll: (filters: Partial<AnomalyFilters>) =>
    api.get<AnomalyFlag[]>('/api/anomalies/', { params: filters }).then(r => r.data),

  getById: (id: string) =>
    api.get<AnomalyFlag>(`/api/anomalies/${id}`).then(r => r.data),

  dismiss: (id: string, payload: DismissPayload) =>
    api.patch<AnomalyFlag>(`/api/anomalies/${id}/dismiss`, payload).then(r => r.data),

  confirm: (id: string) =>
    api.patch<AnomalyFlag>(`/api/anomalies/${id}/confirm`).then(r => r.data),

  review: (id: string) =>
    api.patch<AnomalyFlag>(`/api/anomalies/${id}/review`).then(r => r.data),

  runScan: () =>
    api.post('/api/anomalies/run-scan').then(r => r.data),

  getStats: () =>
    api.get('/api/anomalies/stats').then(r => r.data),
};
```

Implement equivalent service modules for: `zoneService.ts`, `forecastService.ts`, `meterService.ts`, `dashboardService.ts`, `auditService.ts`

### 5.3 React Query Hooks (replace all Zustand data fetching)

Install: `npm install @tanstack/react-query`

```typescript
// frontend/src/hooks/useAnomalies.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { anomalyService } from '../services/anomalyService';
import { AnomalyFilters, DismissPayload } from '../types/meter';

export function useAnomalies(filters: Partial<AnomalyFilters>) {
  return useQuery({
    queryKey: ['anomalies', filters],
    queryFn: () => anomalyService.getAll(filters),
    staleTime: 30_000,     // 30 seconds
    refetchInterval: 60_000, // Auto-refetch every 60s
  });
}

export function useDismissFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DismissPayload }) =>
      anomalyService.dismiss(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['anomalies'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

Implement equivalent hooks for all data types: `useZones`, `useZoneDetail`, `useForecasts`, `useMeterReadings`, `useDashboardSummary`, `useAuditLog`.

### 5.4 Replace All Synthetic Data Imports

In every page and component:
- Remove all imports from `src/data/generators/`
- Replace with the corresponding React Query hook
- Add `<SkeletonLoader />` for loading states
- Add `<EmptyState />` for empty data states
- Add toast notifications for API errors

---

## 🎨 TASK 6 — Frontend Polish

Apply these polish tasks to bring the UI to production quality:

### 6.1 Dashboard Page
- KPI cards: add animated counter (count up from 0 on mount, 800ms duration)
- Zone risk grid: add a hover tooltip showing zone's top contributing risk factor
- Zone risk grid: add a compact sparkline (last 6 hours) using inline SVG — not a full Recharts instance
- System status bar: make "last synced" timestamp live-updating every 30s from `/api/dashboard/system-status`
- Add a "Run Anomaly Scan" button that calls `POST /api/anomalies/run-scan` and shows a loading spinner + success toast

### 6.2 Forecasting Page
- Chart: add animated draw-in of forecast line on mount (`stroke-dashoffset` CSS animation, 800ms)
- Chart: add a vertical "Now" marker line at the current time
- Chart: custom tooltip showing Predicted / Actual / Baseline / Deviation in a styled card
- Zone Risk Map: position zone blocks in a 4×3 geographic grid approximating Bangalore regions (N/S/E/W/C)
- Forecast Table: highlight rows where deviation > 15% with amber background at 10% opacity
- Add forecast accuracy widget: "Last 24h MAE: X.X%" from `/api/forecasts/accuracy`

### 6.3 Anomaly Page
- Filter bar: make all filters reactive — results update without a submit button
- Anomaly cards: stagger entrance animation (50ms per card, fade + 8px slide-up)
- Anomaly cards: add an expandable "Raw Data" section showing last 10 readings as a mini table (JetBrains Mono)
- Dismiss modal: animate in/out (scale 0.95→1.0, opacity 0→1, 200ms ease-out)
- Add a stats bar above the list: counts per AnomalyType shown as horizontal pill chips
- TAMPER_SUSPECTED cards must have a pulsing red left border

### 6.4 Zone Detail Page
- Meter list table: clicking a row expands an inline sparkline of last 24h readings
- Add a "Meter Health" column: NORMAL (green dot) / FLAGGED (amber dot) / SUSPECTED (red pulsing dot)
- Add zone anomaly timeline as a horizontal scrollable event strip at the top of the page

### 6.5 New Page: Audit Log (`/audit`)
- Add to sidebar navigation (icon: `ClipboardList`)
- Table columns: Timestamp · Action · Flag ID (link) · Zone · Reason Code · Notes
- Filter by: Action Type, Zone, Date Range
- Export to CSV button calling `GET /api/audit/export`
- Timeline view toggle: vertical timeline of audit events with icons per action type

### 6.6 Global Polish
- Add a global `<Toast />` system (top-right, auto-dismiss 4s, slide-in animation)
- Sidebar: active route has cyan left border + background `rgba(0,229,255,0.08)`
- Top bar: add a live clock (HH:mm:ss, updates every second, Space Mono font)
- Top bar: add a "SYNTHETIC DATA MODE" badge in amber — always visible
- Add keyboard shortcut `Cmd/Ctrl+K` for a quick-search modal (zone or meter lookup)
- All tables: add sorting by clicking column headers
- All paginated lists: add infinite scroll or page controls
- Empty states: each page has a distinct, context-appropriate empty state message

---

## 🧪 TASK 7 — Testing

### Backend Tests (`backend/tests/`)

```python
# test_anomaly_detection.py
def test_sudden_drop_detected():
    """SUDDEN_DROP flag raised when 4+ consecutive readings are 60%+ below baseline."""
    ...

def test_sudden_drop_not_raised_below_threshold():
    """No flag raised when drop is within normal variation."""
    ...

def test_tamper_requires_both_signals():
    """TAMPER_SUSPECTED only raised when BOTH drop and underreport are present."""
    ...

def test_explanation_never_empty():
    """Every flag produced by any detector must have a non-empty explanation."""
    ...

def test_false_positive_risk_low_when_two_methods_agree():
    """FP risk is LOW only when >= 2 detectors agree."""
    ...
```

```python
# test_forecasting.py
def test_forecast_confidence_interval_always_valid():
    """confidence_low <= predicted_kwh <= confidence_high for all forecasts."""
    ...

def test_risk_level_matches_threshold():
    """A predicted value of 350kWh in a zone with critical threshold of 300kWh must be CRITICAL."""
    ...

def test_forecast_returns_correct_interval_count():
    """24h horizon returns exactly 96 forecast objects."""
    ...
```

```python
# test_api.py — use httpx AsyncClient
async def test_dismiss_flag_creates_audit_entry():
    """Dismissing a flag via PATCH must create an AuditLog entry with matching flag_id."""
    ...

async def test_dismiss_already_dismissed_flag_returns_400():
    ...

async def test_anomalies_endpoint_filters_by_status():
    ...
```

---

## ✅ Final Integration Checklist

Complete this checklist in order:

**Database**
- [ ] `docker-compose up` starts PostgreSQL without errors
- [ ] `alembic upgrade head` creates all 6 tables
- [ ] Seeder runs without errors and produces 32,256 readings + 6+ anomaly flags + 48h forecasts

**Backend**
- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] `GET /api/dashboard/summary` returns all 4 KPI values
- [ ] `GET /api/zones/` returns all 12 zones
- [ ] `GET /api/anomalies/` returns paginated flags with all fields populated
- [ ] `PATCH /api/anomalies/{id}/dismiss` changes status and creates AuditLog row
- [ ] `GET /api/audit/` returns the dismiss event
- [ ] `POST /api/forecasts/run` generates new forecast rows for all zones
- [ ] All detector functions have unit tests that pass
- [ ] No flag in the DB has `explanation = ''` or `NULL`

**Frontend**
- [ ] `VITE_API_BASE_URL` points to `http://localhost:8000`
- [ ] Dashboard loads real data from API (not synthetic generators)
- [ ] Skeleton loaders show during data fetch, not blank screens
- [ ] Anomaly dismiss flow works end-to-end: dismiss → API call → card status updates → audit log updated
- [ ] Forecasting chart shows all 3 lines (predicted / actual / baseline)
- [ ] Zone risk map colors match actual risk levels from API
- [ ] Audit log page shows dismiss event just created
- [ ] "SYNTHETIC DATA MODE" badge visible in top bar
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] No `console.error` in browser during normal navigation

**Non-Negotiables Compliance**
- [ ] No real BESCOM meter data anywhere — all `is_synthetic = true`
- [ ] Every AnomalyFlag has a non-empty `explanation` string
- [ ] Every state change (dismiss/confirm/review) creates an AuditLog entry
- [ ] All thresholds configurable via Settings page → persist to DB
- [ ] No external LLM API calls in the codebase
- [ ] False-positive risk displayed on every anomaly card
