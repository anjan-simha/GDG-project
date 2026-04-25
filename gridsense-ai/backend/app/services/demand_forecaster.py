"""
Demand Forecasting Service
Method: Seasonal naive decomposition with time-of-day and day-of-week multipliers.
Intentionally kept explainable — no black-box deep learning.
[SYNTHETIC DATA] — uses synthetic meter readings only.
"""

import numpy as np
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.meter_reading import MeterReading
from app.models.demand_forecast import DemandForecast
from app.models.zone import Zone, RiskLevel

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
