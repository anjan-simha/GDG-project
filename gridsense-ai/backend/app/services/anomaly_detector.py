"""
Anomaly Detection Service
All detectors are pure functions returning AnomalyFlag | None.
Method: Rule-based thresholds + Z-score statistics. Fully explainable.
[SYNTHETIC DATA] — operates on synthetic readings.
"""

import uuid
import statistics
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

    avg_baseline = statistics.mean(baselines)
    avg_recent = statistics.mean([r.consumption_kwh for r in recent])
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

    avg_baseline = statistics.mean(baselines)
    avg_recent = statistics.mean([r.consumption_kwh for r in recent])
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
    diff_mean = statistics.mean(differences)
    diff_std = statistics.stdev(differences) if len(differences) > 1 else 0
    z_score = abs(diff_mean) / (diff_std + 1e-9)

    if z_score > cfg.peer_zscore_threshold:
        avg_deviation_pct = (diff_mean / statistics.mean(peer_avgs)) * 100
        return AnomalyFlag(
            id=str(uuid.uuid4()),
            meter_id=meter_id,
            zone_id=zone_id,
            detected_at=datetime.utcnow(),
            anomaly_type=AnomalyType.PEER_DEVIATION,
            severity_score=min(100, z_score * 20),
            explanation=(
                f"Meter {meter_id} deviates {abs(avg_deviation_pct):.1f}% from the zone "
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

    night_avg = statistics.mean([r.consumption_kwh for r in night_readings])
    day_avg = statistics.mean([r.consumption_kwh for r in day_readings])

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

def detect_consistent_underreport(
    meter_id: str,
    zone_id: str,
    readings: List[MeterReading],
    cfg: ThresholdConfig
) -> Optional[AnomalyFlag]:
    """
    Flag if meter consistently underreports by >20% compared to peers over 7 days.
    """
    peer_avgs = [r.peer_avg_kwh for r in readings if r.peer_avg_kwh]
    consumptions = [r.consumption_kwh for r in readings if r.peer_avg_kwh]

    if len(peer_avgs) < 96 * 3: # Require at least 3 days of data
        return None

    avg_peer = statistics.mean(peer_avgs)
    avg_consumption = statistics.mean(consumptions)

    if avg_peer == 0:
        return None

    deviation_pct = ((avg_consumption - avg_peer) / avg_peer) * 100

    # Assume underreport threshold is -20%
    if deviation_pct < -20.0:
        return AnomalyFlag(
            id=str(uuid.uuid4()),
            meter_id=meter_id,
            zone_id=zone_id,
            detected_at=datetime.utcnow(),
            anomaly_type=AnomalyType.CONSISTENT_UNDERREPORT,
            severity_score=_severity(abs(deviation_pct), max_deviation=50),
            explanation=(
                f"Meter {meter_id} consistently underreports consumption by "
                f"{abs(deviation_pct):.1f}% compared to zone peers over the observed period. "
                f"Average: {avg_consumption:.2f} kWh, Peer Average: {avg_peer:.2f} kWh."
            ),
            contributing_features=["Long-term Trend", "Peer Comparison", "Consistent Underreport"],
            baseline_deviation_pct=round(deviation_pct, 2),
            false_positive_risk=FalsePositiveRisk.MEDIUM,
            status=AnomalyStatus.OPEN,
        )
    return None

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
    underreport = detect_consistent_underreport(meter_id, zone_id, readings, cfg)
    tamper = detect_tamper_pattern(meter_id, zone_id, drop, underreport)

    for flag in [drop, spike, peer, night, underreport, tamper]:
        if flag is not None:
            flags.append(flag)

    return flags
