"""
GridSense AI — LLM Report Generator
Model: Gemini 1.5 Pro (used for longer, more structured output)
Purpose: Generates zone inspection reports and multi-anomaly pattern summaries.

[SYNTHETIC DATA ONLY] — No real BESCOM data is passed to this service.
"""

import logging
from typing import List, Optional
from datetime import datetime

import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

REPORT_GENERATION_CONFIG = genai.types.GenerationConfig(
    temperature=0.2,           # Very low — reports must be factual
    max_output_tokens=1000,    # Longer output for full reports
    top_p=0.80,
)

SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_HARASSMENT",        "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH",       "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]


@retry(
    stop=stop_after_attempt(2),           # Only 2 retries for expensive Pro calls
    wait=wait_exponential(multiplier=2, min=3, max=15),
    reraise=False,
)
def _call_gemini_pro(prompt: str) -> Optional[str]:
    model = genai.GenerativeModel(
        model_name=settings.gemini_report_model,
        generation_config=REPORT_GENERATION_CONFIG,
        safety_settings=SAFETY_SETTINGS,
    )
    response = model.generate_content(prompt)
    return response.text if response.parts else None


# ── Local Simulation Logic ──────────────────────────────────────────────────

def _simulate_report(zone_name: str, risk_level: str, flags: List[dict]) -> str:
    """Generates a structured simulated report."""
    flag_types = list(set([f.get('anomaly_type', 'Unknown') for f in flags]))
    ts = datetime.utcnow().strftime("%d %b %Y, %H:%M UTC")
    
    return f"""SECTION 1 — ZONE SUMMARY
{zone_name} is currently under {risk_level} risk level monitoring as of {ts}. The distribution network in this area shows localized instability affecting multiple nodes.

SECTION 2 — ANOMALY FINDINGS
We have detected {len(flags)} active flags, primarily consisting of {', '.join(flag_types[:2])}. The highest deviation recorded is {max([f.get('baseline_deviation_pct', 0) for f in flags] + [0]):.1f}%, suggesting either physical infrastructure issues or consumer-side anomalies.

SECTION 3 — RECOMMENDED ACTIONS
1. Dispatch field crews to verify meter integrity for high-severity flags in the {zone_name} cluster.
2. Cross-reference SCADA data for the primary substation serving this zone to rule out upstream phase imbalance.

SECTION 4 — FORECAST OUTLOOK
Demand is expected to remain within {risk_level} thresholds for the next 24 hours. Load balancing is advised if additional anomalies are detected during peak evening hours."""

def _simulate_pattern(zone_name: str, flags: List[dict]) -> str:
    """Generates a simulated pattern summary."""
    types = [f.get("anomaly_type", "") for f in flags]
    type_counts = {t: types.count(t) for t in set(types)}
    type_summary = ", ".join([f"{v}x {k}" for k, v in type_counts.items()])
    
    if len(flags) > 5:
        return f"A significant cluster of {len(flags)} anomalies ({type_summary}) has been detected in {zone_name}. This pattern strongly suggests a zone-wide distribution issue, possibly a transformer-level load imbalance or widespread supply interruption."
    return f"Multiple anomalies ({type_summary}) are occurring in {zone_name}. While these appear semi-isolated, the frequency suggests a developing trend that requires immediate oversight by the zone manager."



def generate_zone_inspection_report(
    zone_name: str,
    zone_id: str,
    risk_level: str,
    flags: List[dict],
    forecast_summary: dict,
    generated_at: Optional[datetime] = None,
) -> str:
    """
    Generates a structured inspection report for a zone using Gemini 1.5 Pro.

    Args:
        zone_name:        Human-readable zone name
        zone_id:          Zone ID string (anonymized)
        risk_level:       Current risk level string
        flags:            List of dicts — each flag has type, severity, explanation,
                          baseline_deviation_pct, false_positive_risk, status
                          (NO raw readings, NO personal data)
        forecast_summary: Dict with predicted_kwh, risk_level, time_range
        generated_at:     Report generation timestamp

    Returns:
        A structured plain-text inspection report. Falls back to a basic summary on error.
    """
    if not settings.llm_enabled:
        return _fallback_report(zone_name, risk_level, flags)

    if settings.llm_mock_mode:
        return _simulate_report(zone_name, risk_level, flags)

    if not settings.gemini_api_key:
        return _fallback_report(zone_name, risk_level, flags)

    ts = (generated_at or datetime.utcnow()).strftime("%d %b %Y, %H:%M UTC")

    # Format flags for the prompt — only derived facts, no raw data
    flag_lines = []
    for i, f in enumerate(flags[:10], 1):  # Cap at 10 flags per report
        flag_lines.append(
            f"  {i}. Type: {f.get('anomaly_type', 'Unknown')} | "
            f"Severity: {f.get('severity_score', 0):.0f}/100 | "
            f"Deviation: {f.get('baseline_deviation_pct', 0):.1f}% | "
            f"FP Risk: {f.get('false_positive_risk', 'N/A')} | "
            f"Status: {f.get('status', 'OPEN')}"
        )
    flags_str = "\n".join(flag_lines) if flag_lines else "  No active flags."

    prompt = f"""You are GridSense, generating a structured inspection report for BESCOM field teams.
This report covers a single distribution zone and summarizes anomaly findings and forecast outlook.
All data is synthetic/masked for system testing — treat it as real.

Report date: {ts}
Zone: {zone_name} (ID: {zone_id})
Current risk level: {risk_level}

Active anomaly flags ({len(flags)} total):
{flags_str}

Forecast outlook:
  Predicted peak load: {forecast_summary.get('predicted_peak_kwh', 'N/A')} kWh
  Forecast risk level: {forecast_summary.get('risk_level', 'N/A')}
  Time window: {forecast_summary.get('time_range', 'Next 24 hours')}

Write a concise inspection report with EXACTLY these four sections.
Use plain text only — no markdown, no asterisks, no bullet points.
Label each section clearly on its own line.

SECTION 1 — ZONE SUMMARY (2 sentences: current state and risk level)
SECTION 2 — ANOMALY FINDINGS (3–4 sentences: what was detected and why it matters)
SECTION 3 — RECOMMENDED ACTIONS (2–3 specific, actionable steps for field teams)
SECTION 4 — FORECAST OUTLOOK (2 sentences: expected demand and any load risks)

Keep the total report under 250 words.
"""

    try:
        result = _call_gemini_pro(prompt)
        if result and len(result.strip()) > 50:
            return result.strip()
        raise ValueError("Report response too short")
    except Exception as e:
        error_str = str(e).lower()
        if "429" in error_str or "quota" in error_str or "resourceexhausted" in error_str:
            logger.warning(f"[LLM] Quota exceeded. Falling back to simulation.")
            return _simulate_report(zone_name, risk_level, flags)
            
        logger.warning(f"[LLM] Report generation failed for zone {zone_id}: {e}")
        return _fallback_report(zone_name, risk_level, flags)


def summarise_multi_anomaly_pattern(
    zone_name: str,
    flags: List[dict],
) -> str:
    """
    When 3+ meters in the same zone are flagged simultaneously,
    generates a pattern-level summary to help operators understand
    if this is a zone-wide issue or isolated incidents.
    """
    if not settings.llm_enabled:
        return f"{len(flags)} anomalies detected across multiple meters in {zone_name}. Manual review recommended."

    if settings.llm_mock_mode:
        return f"[SIMULATED] {_simulate_pattern(zone_name, flags)}"

    if not settings.gemini_api_key:
        return f"{len(flags)} anomalies detected across multiple meters in {zone_name}. Manual review recommended."

    types = [f.get("anomaly_type", "") for f in flags]
    type_counts = {t: types.count(t) for t in set(types)}
    type_summary = ", ".join([f"{v}x {k}" for k, v in type_counts.items()])

    prompt = f"""You are GridSense, a smart grid monitoring assistant for BESCOM, Bengaluru.
Multiple anomaly flags have been detected simultaneously across meters in a single zone.
Determine if this looks like an isolated coincidence or a zone-level pattern worth escalating.

Zone: {zone_name}
Number of flagged meters: {len(flags)}
Anomaly types detected: {type_summary}

Write 2 sentences:
1. Describe what the pattern suggests (zone-wide issue, isolated incidents, or inconclusive).
2. State the recommended next step for the operations team.
Do not use bullet points. Write in plain English. Be direct.
"""

    try:
        result = _call_gemini_pro(prompt)
        if result and len(result.strip()) > 20:
            return result.strip()
        raise ValueError("Empty summary")
    except Exception as e:
        error_str = str(e).lower()
        if "429" in error_str or "quota" in error_str or "resourceexhausted" in error_str:
            logger.warning(f"[LLM] Quota exceeded. Falling back to simulation.")
            return f"[SIMULATED] {_simulate_pattern(zone_name, flags)}"
            
        logger.warning(f"[LLM] Pattern summary failed: {e}")
        return (
            f"{len(flags)} anomalies detected across multiple meters in {zone_name} "
            f"({type_summary}). Manual review is recommended."
        )


def _fallback_report(zone_name: str, risk_level: str, flags: List[dict]) -> str:
    """Plain-text fallback report when LLM is unavailable."""
    open_flags = [f for f in flags if f.get("status") == "OPEN"]
    return (
        f"ZONE SUMMARY\n"
        f"Zone {zone_name} is currently at {risk_level} risk level "
        f"with {len(open_flags)} open anomaly flags.\n\n"
        f"ANOMALY FINDINGS\n"
        f"{len(flags)} total flags detected. Review the anomaly list for details.\n\n"
        f"RECOMMENDED ACTIONS\n"
        f"Review all open flags and dispatch field teams to meters with HIGH or CRITICAL severity.\n\n"
        f"FORECAST OUTLOOK\n"
        f"Check the forecasting dashboard for the latest demand predictions."
    )
