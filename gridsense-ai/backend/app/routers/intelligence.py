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
def ask_operator_question(
    body: OperatorQuestionRequest,
    db: Session = Depends(get_db)
):
    """
    Answers a natural language question from a grid operator.
    Assembles context from the DB. Falls back to synthetic baseline
    context during development if the DB is not yet seeded.
    All LLM calls are audit-logged.
    """
    import logging
    import json
    logger = logging.getLogger(__name__)

    # ── 1. Assemble DB context ────────────────────────────────────────────
    zones = db.query(Zone).all()
    open_flags = db.query(AnomalyFlag).filter(
        AnomalyFlag.status == AnomalyStatus.OPEN
    ).all()
    high_risk_count = sum(
        1 for z in zones if z.risk_level in ("HIGH", "CRITICAL")
    )

    # ── 2. Build context string ───────────────────────────────────────────
    # Use real DB data if available; fall back to synthetic baseline for dev
    if zones:
        zone_lines = []
        for z in zones[:12]:
            open_for_zone = sum(1 for f in open_flags if f.zone_id == z.id)
            zone_lines.append(
                f"- {z.name} ({z.id}): Risk={z.risk_level}, "
                f"Load={z.current_load_kwh or 0:.1f} kWh, "
                f"Open flags={open_for_zone}"
            )
        zones_str = "\n".join(zone_lines)
    else:
        # Synthetic fallback for empty DB — always gives LLM something to work with
        zones_str = (
            "- Whitefield (BLR-E02): Risk=HIGH, Load=198.4 kWh, Open flags=2\n"
            "- Electronic City (BLR-S03): Risk=CRITICAL, Load=312.7 kWh, Open flags=3\n"
            "- Indiranagar (BLR-E01): Risk=MODERATE, Load=134.2 kWh, Open flags=1\n"
            "- Rajajinagar (BLR-N01): Risk=LOW, Load=94.1 kWh, Open flags=0\n"
            "- Jayanagar (BLR-S01): Risk=LOW, Load=88.3 kWh, Open flags=0\n"
            "(Showing synthetic baseline — database not yet seeded)"
        )
        high_risk_count = 2

    flag_type_counts: dict = {}
    for f in open_flags:
        t = str(f.anomaly_type)
        flag_type_counts[t] = flag_type_counts.get(t, 0) + 1
    flag_summary = (
        ", ".join(f"{v}x {k}" for k, v in flag_type_counts.items())
        if flag_type_counts
        else "None currently"
    )

    context_str = f"""
NETWORK STATE (synthetic/masked data):
Zones monitored: {len(zones) or 12}
High/Critical risk zones: {high_risk_count}
Total open anomaly flags: {len(open_flags)}
Flag breakdown: {flag_summary}

Zone details:
{zones_str}
""".strip()

    # Log context in dev so you can see what the model receives
    logger.info(f"[LLM /ask] Context sent to Gemini:\n{context_str}")

    # ── 3. Build prompt ───────────────────────────────────────────────────
    prompt = f"""You are GridSense, an AI assistant for BESCOM grid operators in Bengaluru.
You help operators understand the smart meter monitoring dashboard.
All data is synthetic/masked for testing purposes — treat it as real.

Current network state:
{context_str}

Operator question: {body.question.strip()}

Answer in 2-3 sentences. Be direct and factual.
Base your answer on the network state above.
If something is not in the data, say so briefly.
Do not use bullet points or markdown. Write in plain English.
Do not say "as an AI" or that this is a simulated output — respond confidently as the monitoring system.
"""

    # ── 4. Call Gemini ────────────────────────────────────────────────────
    if not settings.llm_enabled or not settings.gemini_api_key:
        return OperatorQuestionResponse(
            answer=(
                "AI assistant is disabled. Set GEMINI_API_KEY and LLM_ENABLED=true "
                "in backend/.env to enable it."
            ),
            model_used="disabled",
        )

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(
            model_name=settings.gemini_primary_model,
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,
                max_output_tokens=300,
            ),
        )
        response = model.generate_content(prompt)

        # Validate response
        if not response.parts:
            raise ValueError("Gemini returned an empty response (possibly blocked by safety filters)")

        answer = response.text.strip()
        if len(answer) < 10:
            raise ValueError(f"Response too short: '{answer}'")

        # Log success to audit table
        from app.services.llm_explainer import _write_audit_log
        _write_audit_log(
            db, None, None,
            settings.gemini_primary_model, True,
            f"Q&A answered: {body.question[:80]}"
        )

        return OperatorQuestionResponse(
            answer=answer,
            model_used=settings.gemini_primary_model,
        )

    except Exception as e:
        logger.error(f"[LLM /ask] Gemini call failed: {type(e).__name__}: {e}")

        # Log failure to audit table
        from app.services.llm_explainer import _write_audit_log
        _write_audit_log(
            db, None, None,
            settings.gemini_primary_model, False,
            f"Q&A failed: {str(e)[:120]}"
        )

        # Return a meaningful fallback that includes the error type for debugging
        return OperatorQuestionResponse(
            answer=(
                f"The AI service returned an error ({type(e).__name__}). "
                f"Check that your GEMINI_API_KEY is valid and the model "
                f"'{settings.gemini_primary_model}' is accessible on your API key. "
                f"The network currently has {len(open_flags)} open flags across "
                f"{len(zones)} monitored zones."
            ),
            model_used=f"fallback ({settings.gemini_primary_model})",
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


@router.get("/health")
def llm_health_check(db: Session = Depends(get_db)):
    """
    Diagnostic endpoint. Returns:
    - Whether the API key is configured
    - Whether the Gemini SDK can reach the API
    - Whether the DB has seeded data (zones, flags, forecasts)
    - The exact model being used

    Call this first when debugging chatbot issues.
    GET /api/intelligence/health
    """
    from app.models.zone import Zone
    from app.models.anomaly_flag import AnomalyFlag
    from app.models.demand_forecast import DemandForecast

    # Check DB state
    zone_count = db.query(Zone).count()
    flag_count = db.query(AnomalyFlag).count()
    forecast_count = db.query(DemandForecast).count()

    # Check API key presence
    api_key_set = bool(settings.gemini_api_key and len(settings.gemini_api_key) > 10)

    # Test a minimal Gemini call
    gemini_reachable = False
    gemini_error = None
    if api_key_set and settings.llm_enabled:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.gemini_api_key)
            model = genai.GenerativeModel(settings.gemini_primary_model)
            resp = model.generate_content("Reply with the single word: OK")
            gemini_reachable = "ok" in resp.text.lower() if resp.parts else False
        except Exception as e:
            gemini_error = str(e)

    return {
        "status": "ok" if (api_key_set and gemini_reachable and zone_count > 0) else "degraded",
        "api_key_configured": api_key_set,
        "llm_enabled": settings.llm_enabled,
        "model_primary": settings.gemini_primary_model,
        "model_report": settings.gemini_report_model,
        "gemini_reachable": gemini_reachable,
        "gemini_error": gemini_error,
        "db_zones": zone_count,
        "db_flags": flag_count,
        "db_forecasts": forecast_count,
        "db_seeded": zone_count >= 12,
    }
