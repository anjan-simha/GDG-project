"""
GridSense AI — Intelligence Router
Prefix: /api/intelligence
All endpoints use Gemini LLM for natural language generation.
All calls are on synthetic data only. All calls are audit-logged.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.config import get_settings
from app.models.anomaly_flag import AnomalyFlag, AnomalyStatus
from app.models.demand_forecast import DemandForecast
from app.models.zone import Zone
from app.services.llm_explainer import enrich_flag_explanation, answer_operator_question
from app.services.llm_reporter import (
    generate_zone_inspection_report,
    summarise_multi_anomaly_pattern,
)
from app.schemas.intelligence import (
    EnrichFlagRequest, EnrichFlagResponse,
    OperatorQuestionRequest, OperatorQuestionResponse,
    ZoneReportRequest, ZoneReportResponse,
    PatternSummaryResponse,
)

router = APIRouter()
settings = get_settings()


@router.post("/enrich-flag", response_model=EnrichFlagResponse)
def enrich_flag(body: EnrichFlagRequest, db: Session = Depends(get_db)):
    """
    Enriches a single anomaly flag's explanation using Gemini 2.0 Flash.
    The enriched explanation is returned in the response but NOT saved back
    to the DB automatically — the frontend can choose to display it inline.
    """
    flag = db.query(AnomalyFlag).filter(AnomalyFlag.id == body.flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")

    zone = db.query(Zone).filter(Zone.id == flag.zone_id).first()
    zone_name = zone.name if zone else flag.zone_id

    original = flag.explanation
    enriched = enrich_flag_explanation(db, flag, zone_name)
    fallback_used = enriched == original

    return EnrichFlagResponse(
        flag_id=body.flag_id,
        enriched_explanation=enriched,
        model_used=settings.gemini_primary_model,
        fallback_used=fallback_used,
    )


@router.post("/ask", response_model=OperatorQuestionResponse)
def ask_operator_question(body: OperatorQuestionRequest, db: Session = Depends(get_db)):
    """
    Answers a natural language question from a grid operator.
    Context is assembled from live DB queries — no raw readings passed to LLM.
    """
    # Assemble anonymized context from DB
    zones = db.query(Zone).all()
    open_flag_count = db.query(AnomalyFlag).filter(
        AnomalyFlag.status == AnomalyStatus.OPEN
    ).count()
    high_risk_count = sum(1 for z in zones if z.risk_level in ("HIGH", "CRITICAL"))

    # Calculate 24h forecast accuracy (MAE) from stored actuals
    recent_forecasts = db.query(DemandForecast).filter(
        DemandForecast.actual_kwh.isnot(None),
        DemandForecast.mae.isnot(None),
    ).limit(96).all()  # Last 96 intervals
    accuracy = 100.0
    if recent_forecasts:
        avg_mae = sum(f.mae for f in recent_forecasts) / len(recent_forecasts)
        avg_actual = sum(f.actual_kwh for f in recent_forecasts) / len(recent_forecasts)
        accuracy = max(0, 100 - (avg_mae / max(avg_actual, 1)) * 100)

    context = {
        "zones": [
            {
                "id": z.id,
                "name": z.name,
                "risk_level": z.risk_level,
                "current_load_kwh": z.current_load_kwh or 0,
                "open_flag_count": sum(
                    1 for f in z.anomaly_flags
                    if f.status == AnomalyStatus.OPEN
                ) if z.anomaly_flags else 0,
            }
            for z in zones
        ],
        "open_flags_total": open_flag_count,
        "high_risk_zones": high_risk_count,
        "forecast_accuracy_24h": accuracy,
    }

    answer = answer_operator_question(db, body.question, context)
    return OperatorQuestionResponse(
        answer=answer,
        model_used=settings.gemini_primary_model,
    )


@router.post("/zone-report", response_model=ZoneReportResponse)
def generate_report(body: ZoneReportRequest, db: Session = Depends(get_db)):
    """
    Generates a full inspection report for a zone using Gemini 1.5 Pro.
    """
    zone = db.query(Zone).filter(Zone.id == body.zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    # Fetch flags — only derived facts go to LLM
    flags_raw = db.query(AnomalyFlag).filter(
        AnomalyFlag.zone_id == body.zone_id
    ).order_by(AnomalyFlag.detected_at.desc()).limit(10).all()

    flags_for_llm = [
        {
            "anomaly_type": str(f.anomaly_type),
            "severity_score": f.severity_score,
            "baseline_deviation_pct": f.baseline_deviation_pct,
            "false_positive_risk": str(f.false_positive_risk),
            "status": str(f.status),
        }
        for f in flags_raw
    ]

    # Fetch latest forecast summary
    latest_forecast = db.query(DemandForecast).filter(
        DemandForecast.zone_id == body.zone_id,
        DemandForecast.actual_kwh.is_(None),  # Future intervals only
    ).order_by(DemandForecast.predicted_kwh.desc()).first()

    forecast_summary = {
        "predicted_peak_kwh": f"{latest_forecast.predicted_kwh:.1f}" if latest_forecast else "N/A",
        "risk_level": str(latest_forecast.risk_level) if latest_forecast else "N/A",
        "time_range": "Next 24 hours",
    }

    report = generate_zone_inspection_report(
        zone_name=zone.name,
        zone_id=zone.id,
        risk_level=str(zone.risk_level),
        flags=flags_for_llm,
        forecast_summary=forecast_summary,
        generated_at=datetime.utcnow(),
    )

    return ZoneReportResponse(
        zone_id=zone.id,
        zone_name=zone.name,
        report_text=report,
        generated_at=datetime.utcnow().isoformat(),
        model_used=settings.gemini_report_model,
    )


@router.get("/zone-pattern/{zone_id}", response_model=PatternSummaryResponse)
def get_zone_pattern_summary(zone_id: str, db: Session = Depends(get_db)):
    """
    When 3+ meters in a zone are flagged, generates a pattern-level summary.
    Returns a simple message if fewer than 3 flags exist.
    """
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    open_flags = db.query(AnomalyFlag).filter(
        AnomalyFlag.zone_id == zone_id,
        AnomalyFlag.status == AnomalyStatus.OPEN,
    ).all()

    if len(open_flags) < 3:
        return PatternSummaryResponse(
            zone_id=zone_id,
            flag_count=len(open_flags),
            summary=f"Only {len(open_flags)} open flag(s) in {zone.name}. No multi-meter pattern detected.",
        )

    flags_for_llm = [
        {"anomaly_type": str(f.anomaly_type), "severity_score": f.severity_score}
        for f in open_flags
    ]

    summary = summarise_multi_anomaly_pattern(zone.name, flags_for_llm)
    return PatternSummaryResponse(
        zone_id=zone_id,
        flag_count=len(open_flags),
        summary=summary,
    )
