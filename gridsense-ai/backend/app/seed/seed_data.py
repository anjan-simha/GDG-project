import uuid
import random
import numpy as np
from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models.zone import Zone, RiskLevel
from app.models.meter import Meter, MeterStatus
from app.models.meter_reading import MeterReading
from app.services.anomaly_detector import run_all_detectors
from app.services.demand_forecaster import generate_zone_forecast
from app.config import get_thresholds
from app.models.anomaly_flag import AnomalyFlag
from app.models.audit_log import AuditLog
from app.models.demand_forecast import DemandForecast

# Make sure tables exist (usually Alembic does this, but for seeder convenience we run create_all)
Base.metadata.create_all(bind=engine)

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

TIME_OF_DAY_MULTIPLIERS = {
    range(0, 5):   0.45,
    range(5, 7):   0.70,
    range(7, 10):  1.40,
    range(10, 17): 1.10,
    range(17, 22): 1.65,
    range(22, 24): 0.80,
}

def get_tod_multiplier(hour: int) -> float:
    for hour_range, multiplier in TIME_OF_DAY_MULTIPLIERS.items():
        if hour in hour_range:
            return multiplier
    return 1.0

def seed_database():
    db = SessionLocal()
    print("Starting database seed...")
    
    # 1. Create Zones
    db_zones = []
    for z in ZONES:
        zone = db.query(Zone).filter(Zone.id == z["id"]).first()
        if not zone:
            zone = Zone(
                id=z["id"],
                name=z["name"],
                region=z["region"],
                base_kwh_min=z["base"][0],
                base_kwh_max=z["base"][1],
                active_meter_count=4,
                last_updated=datetime.utcnow()
            )
            db.add(zone)
        db_zones.append(zone)
    db.commit()
    print("Zones seeded.")

    # 2. Create 4 meters per zone (48 total)
    db_meters = []
    for z in ZONES:
        for i in range(1, 5):
            meter_id = f"{z['id']}-M{i:02d}"
            meter = db.query(Meter).filter(Meter.id == meter_id).first()
            if not meter:
                meter = Meter(
                    id=meter_id,
                    zone_id=z["id"],
                    installed_at=datetime.utcnow() - timedelta(days=365),
                    last_reading_at=datetime.utcnow()
                )
                db.add(meter)
            db_meters.append(meter)
    db.commit()
    print("Meters seeded.")

    # 3. Generate 7 days of readings (96 intervals/day = 672 readings per meter)
    now = datetime.utcnow().replace(second=0, microsecond=0)
    minutes = (now.minute // 15) * 15
    end_time = now.replace(minute=minutes)
    start_time = end_time - timedelta(days=7)
    
    # Check if readings exist to avoid duplicate seeding taking too long
    existing_readings = db.query(MeterReading).count()
    if existing_readings > 0:
        print("Readings already exist. Skipping reading generation...")
    else:
        print("Generating 32,256 meter readings... This may take a moment.")
        
        # Calculate base consumption values per meter
        meter_bases = {}
        for m in db_meters:
            zone_info = next(z for z in ZONES if z["id"] == m.zone_id)
            meter_base = random.uniform(zone_info["base"][0] / 100, zone_info["base"][1] / 100)
            meter_bases[m.id] = meter_base
            
        readings = []
        timestamps = [start_time + timedelta(minutes=15 * i) for i in range(672)]
        
        # Structure to easily calculate peer averages later
        interval_data = {ts: {z["id"]: [] for z in ZONES} for ts in timestamps}
        
        # Base readings generation
        for m in db_meters:
            base = meter_bases[m.id]
            for ts in timestamps:
                tod_mult = get_tod_multiplier(ts.hour)
                # Base consumption for this interval
                val = base * tod_mult
                # Add noise
                val = max(0.1, np.random.normal(val, val * 0.1))
                
                # Apply anomalies based on requirements
                # SUDDEN_DROP for last 8 intervals
                if m.id == "BLR-E02-M03" and ts >= end_time - timedelta(hours=2):
                    val *= 0.3
                    
                # SUDDEN_SPIKE for 4 intervals 3 days ago
                if m.id == "BLR-S03-M01" and (end_time - timedelta(days=3, hours=1)) <= ts <= (end_time - timedelta(days=3)):
                    val *= 3.0
                    
                # CONSISTENT_UNDERREPORT (20% below peers)
                if m.id == "BLR-W01-M02":
                    val *= 0.75
                    
                # NIGHT_USAGE_ANOMALY (heavy 1am-4am usage)
                if m.id == "BLR-C01-M04" and 1 <= ts.hour <= 4:
                    val *= 4.0
                    
                # PEER_DEVIATION (Z > 2.5) -> making this consistently high
                if m.id == "BLR-N01-M01":
                    val *= 2.0
                    
                # TAMPER_SUSPECTED (drop + underreport combined)
                if m.id == "BLR-E01-M02":
                    val *= 0.7  # Consistent underreport
                    if ts >= end_time - timedelta(hours=6):
                        val *= 0.2  # Sudden drop

                reading = MeterReading(
                    id=f"{m.id}-{ts.strftime('%Y%m%d%H%M')}",
                    meter_id=m.id,
                    zone_id=m.zone_id,
                    timestamp=ts,
                    consumption_kwh=round(val, 3),
                    voltage_v=round(random.uniform(220, 240), 1),
                    current_a=round(random.uniform(5, 15), 2),
                    power_factor=round(random.uniform(0.85, 0.99), 2),
                )
                readings.append(reading)
                interval_data[ts][m.zone_id].append(val)
                
        # 4 & 5. Calculate peer_avg_kwh and baseline_kwh
        print("Calculating baselines and peer averages...")
        for r in readings:
            r.peer_avg_kwh = round(np.mean(interval_data[r.timestamp][r.zone_id]), 3)
            # For simplicity in the seeder, mock baseline as average of all 7 days for this slot
            # Note: in real-world this would be rolling, but here we just take the meter_base * tod
            m_base = meter_bases[r.meter_id]
            r.baseline_kwh = round(m_base * get_tod_multiplier(r.timestamp.hour), 3)

        # Batch insert readings
        db.bulk_save_objects(readings)
        db.commit()
        print(f"Inserted {len(readings)} readings.")

    # 6. Run anomaly detectors
    print("Running anomaly detectors...")
    cfg = get_thresholds()
    new_flags = []
    for m in db_meters:
        m_readings = db.query(MeterReading).filter(MeterReading.meter_id == m.id).order_by(MeterReading.timestamp).all()
        flags = run_all_detectors(m.id, m.zone_id, m_readings, cfg)
        for flag in flags:
            exists = db.query(AnomalyFlag).filter(
                AnomalyFlag.meter_id == flag.meter_id,
                AnomalyFlag.anomaly_type == flag.anomaly_type,
                AnomalyFlag.detected_at == flag.detected_at
            ).first()
            if not exists:
                new_flags.append(flag)
    
    if new_flags:
        db.bulk_save_objects(new_flags)
        db.commit()
    print(f"Generated {len(new_flags)} anomaly flags.")

    # 7. Generate 48-hour forecasts for all zones
    print("Generating forecasts...")
    forecasts_count = 0
    for z in db_zones:
        # Check if forecasts already exist for this zone near now
        exists = db.query(DemandForecast).filter(DemandForecast.zone_id == z.id).first()
        if not exists:
            zone_forecasts = generate_zone_forecast(db, z, horizon_hours=48)
            db.bulk_save_objects(zone_forecasts)
            forecasts_count += len(zone_forecasts)
            
            # Update zone risk level based on max forecast risk
            max_risk = RiskLevel.LOW
            for f in zone_forecasts:
                if f.risk_level == RiskLevel.CRITICAL:
                    max_risk = RiskLevel.CRITICAL
                elif f.risk_level == RiskLevel.HIGH and max_risk != RiskLevel.CRITICAL:
                    max_risk = RiskLevel.HIGH
                elif f.risk_level == RiskLevel.MODERATE and max_risk in [RiskLevel.LOW, RiskLevel.MODERATE]:
                    max_risk = RiskLevel.MODERATE
            z.risk_level = max_risk
            
            # Update zone load
            recent_reading = db.query(MeterReading).filter(MeterReading.zone_id == z.id).order_by(MeterReading.timestamp.desc()).first()
            if recent_reading:
                z.current_load_kwh = recent_reading.peer_avg_kwh * 4 # Mocking current load
                
    db.commit()
    print(f"Generated {forecasts_count} forecast entries.")
    
    print("Seed complete.")
    db.close()

if __name__ == "__main__":
    seed_database()
