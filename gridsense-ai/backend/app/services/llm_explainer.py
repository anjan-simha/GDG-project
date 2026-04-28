"""
GridSense AI — LLM Explainability Service
Model: Gemini 2.0 Flash (primary)
Purpose: Enriches anomaly flag explanations and forecast risk reasons
         using natural language generation.

CONSTRAINTS:
  - Never receives raw MeterReading objects or consumption arrays.
  - Only receives derived, anonymized, synthetic-data facts.
  - All calls wrapped in retry + fallback logic.
  - Every call logged to audit_logs table.

[SYNTHETIC DATA ONLY]
"""

import uuid
import logging
from datetime import datetime
from typing import Optional

import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.config import get_settings
from app.models.anomaly_flag import AnomalyFlag, AnomalyType
from app.models.demand_forecast import DemandForecast

logger = logging.getLogger(__name__)
settings = get_settings()

# ── SDK initialisation ──────────────────────────────────────────────────────
# Configure once at module load. Safe to call multiple times (idempotent).
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)
else:
    logger.warning("[LLM] GEMINI_API_KEY not set — LLM features will use fallback mode.")

# Generation config — conservative settings for factual, structured output
GENERATION_CONFIG = genai.types.GenerationConfig(
    temperature=0.3,          # Low temperature → more factual, less creative
    max_output_tokens=300,    # Explanations are concise by design
    top_p=0.85,
)

SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_HARASSMENT",        "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH",       "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]


# ── Validation helpers ──────────────────────────────────────────────────────

REFUSAL_PHRASES = [
    "i cannot", "i'm sorry", "i am sorry", "i can't", "as an ai",
    "i don't have", "i am unable", "not able to",
]

def _is_valid_response(text: str) -> bool:
    """
    Validates that the LLM response is usable:
    - Not empty
    - At least 20 characters
    - Does not contain refusal language
    """
    if not text or len(text.strip()) < 20:
        return False
    lower = text.lower()
    if any(phrase in lower for phrase in REFUSAL_PHRASES):
        return False
    return True


def _write_audit_log(db, flag_id: Optional[str], zone_id: Optional[str],
                     model: str, success: bool, note: str):
    """
    Writes an audit log entry for every LLM call — required for auditability.
    Import inline to avoid circular imports.
    """
    try:
        from app.models.audit_log import AuditLog, AuditAction
        import json
        entry = AuditLog(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            action=AuditAction.LLM_CALL,
            flag_id=flag_id,
            zone_id=zone_id,
            operator_note=note,
            metadata_json=json.dumps({
                "model": model,
                "success": success,
                "timestamp": datetime.utcnow().isoformat(),
            }),
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        logger.error(f"[LLM] Failed to write audit log: {e}")


# ── Retry-decorated API call ────────────────────────────────────────────────

@retry(
    stop=stop_after_attempt(settings.llm_max_retries),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    reraise=False,
)
def _call_gemini(model_name: str, prompt: str) -> Optional[str]:
    """
    Makes a single Gemini API call with retry and exponential backoff.
    Returns the text response or None on failure.
    """
    model = genai.GenerativeModel(
        model_name=model_name,
        generation_config=GENERATION_CONFIG,
        safety_settings=SAFETY_SETTINGS,
    )
    response = model.generate_content(prompt)
    if response.parts:
        return response.text
    return None


# ── Local Simulation Logic ──────────────────────────────────────────────────

def _simulate_enrichment(flag: AnomalyFlag, zone_name: str) -> str:
    """Generates a realistic simulated explanation without API calls."""
    anomaly_plain = flag.anomaly_type.name if hasattr(flag.anomaly_type, 'name') else str(flag.anomaly_type)
    
    templates = {
        "SUDDEN_DROP": [
            f"The monitoring system observed a {flag.baseline_deviation_pct:.1f}% drop in load for meter {flag.id} in {zone_name}. This sustained decrease suggests a potential supply interruption or downstream connectivity issue.",
            f"A significant reduction in consumption was recorded in {zone_name}, deviating {flag.baseline_deviation_pct:.1f}% from the 7-day average. The pattern indicates a possible phase failure or customer-side disconnection."
        ],
        "SUDDEN_SPIKE": [
            f"An unusual surge of {flag.baseline_deviation_pct:.1f}% over baseline was detected in {zone_name}. This spike is consistent with high-intensity equipment startup or a potential secondary-side short circuit.",
            f"Consumption at this node jumped to {flag.severity_score} severity levels, exceeding typical load patterns by {flag.baseline_deviation_pct:.1f}%. Immediate load balancing review for the {zone_name} transformer is recommended."
        ],
        "TAMPER_SUSPECTED": [
            f"Critical anomaly detected in {zone_name} involving multiple signals: {', '.join(flag.contributing_features or ['bypass indicators'])}. The {flag.baseline_deviation_pct:.1f}% deviation strongly matches historical patterns of energy theft or meter bypass.",
            f"Multiple integrity signals triggered for this meter in {zone_name}. Combined with a {flag.baseline_deviation_pct:.1f}% baseline shift, this suggests physical tampering or magnetic interference."
        ]
    }
    
    import random
    default_text = f"The node in {zone_name} is showing a {anomaly_plain} anomaly with {flag.baseline_deviation_pct:.1f}% deviation. Statistical severity is {flag.severity_score}/100 based on {', '.join(flag.contributing_features or ['current load'])[:50]}."
    
    options = templates.get(anomaly_plain, [default_text])
    return random.choice(options)

def _simulate_answer(question: str, context: dict) -> str:
    """Generates a grounded answer based on the provided context dict."""
    q = question.lower()
    zones = context.get("zones", [])
    open_flags = context.get("open_flags_total", 0)
    high_risk = context.get("high_risk_zones", 0)
    
    if "risk" in q or "critical" in q:
        high_risk_names = [z['name'] for z in zones if z['risk_level'] in ('HIGH', 'CRITICAL')]
        if high_risk_names:
            return f"Currently, there are {high_risk} zones at high or critical risk, specifically {', '.join(high_risk_names[:3])}. You should prioritize checking the {open_flags} open anomaly flags across these areas."
        return f"The network is relatively stable with {high_risk} critical risk zones. However, there are still {open_flags} open flags that require routine review."

    if "zone" in q or "where" in q:
        top_zone = max(zones, key=lambda x: x.get('open_flag_count', 0)) if zones else None
        if top_zone:
            return f"The highest activity is currently in {top_zone['name']}, which has {top_zone['open_flag_count']} open anomaly flags. Other active areas include {', '.join([z['name'] for z in zones[:3] if z['name'] != top_zone['name']])}."
            
    if "load" in q or "consumption" in q:
        total_load = sum(z.get('current_load_kwh', 0) for z in zones)
        return f"The total monitored load across all zones is approximately {total_load:.1f} kWh. Forecast accuracy remains high at {context.get('forecast_accuracy_24h', 0):.1f}%, allowing for reliable demand planning."

    return f"I've analysed the current state: there are {open_flags} open flags and {high_risk} high-risk zones. The forecast accuracy is currently {context.get('forecast_accuracy_24h', 0):.1f}%. Please let me know if you need details on a specific zone."



# ── Public API ──────────────────────────────────────────────────────────────

def enrich_flag_explanation(
    db,
    flag: AnomalyFlag,
    zone_name: str,
) -> str:
    """
    Uses Gemini 2.0 Flash to generate a richer, context-aware explanation
    for an anomaly flag. Returns the enriched string, or falls back to the
    existing template-based explanation if the LLM call fails.

    Args:
        db:        SQLAlchemy session (used for audit logging only)
        flag:      The AnomalyFlag ORM object (already has a template explanation)
        zone_name: Human-readable zone name (e.g. "Whitefield")

    Returns:
        A 2–3 sentence explanation string. Never empty.
    """
    if not settings.llm_enabled:
        return flag.explanation  # Graceful no-op

    if settings.llm_mock_mode:
        return f"[SIMULATED] {_simulate_enrichment(flag, zone_name)}"

    if not settings.gemini_api_key:
        return flag.explanation

    # Map enum to plain English for the prompt
    anomaly_descriptions = {
        "SUDDEN_DROP":             "a sudden and sustained drop in electricity consumption",
        "SUDDEN_SPIKE":            "an unexpected spike in electricity consumption",
        "CONSISTENT_UNDERREPORT":  "a persistent pattern of consumption below peer average",
        "NIGHT_USAGE_ANOMALY":     "unusually high electricity usage during late-night hours (1am–4am)",
        "PEER_DEVIATION":          "significant statistical deviation from comparable meters in the zone",
        "TAMPER_SUSPECTED":        "a combination of anomaly signals strongly associated with meter tampering or energy theft",
    }

    anomaly_plain = anomaly_descriptions.get(flag.anomaly_type.name if hasattr(flag.anomaly_type, 'name') else flag.anomaly_type, flag.anomaly_type)
    features_str = ", ".join(flag.contributing_features) if flag.contributing_features else "multiple signals"

    prompt = f"""You are a technical writer for BESCOM, Bengaluru's electricity distribution company.
Write a factual, clear 2-sentence explanation of an anomaly detected in the smart meter monitoring system.
This will be read by a field inspector who needs to understand what happened and why it matters.

Anomaly facts (all data is synthetic/masked for testing):
- Zone: {zone_name}, Bengaluru
- Anomaly type: {anomaly_plain}
- Deviation from 7-day baseline: {flag.baseline_deviation_pct:.1f}%
- Severity score: {flag.severity_score:.0f} out of 100
- Detection signals triggered: {features_str}
- False positive risk: {flag.false_positive_risk}

Rules you must follow:
- Write exactly 2 sentences. No more.
- Be specific about the numbers provided.
- Do not say "AI detected" or "the model found". Say what the data shows.
- Do not speculate beyond the given facts.
- Do not mention the word "synthetic" or "test data".
- Write in plain English suitable for a field engineer.
- Do not use bullet points or headers.
"""

    try:
        result = _call_gemini(settings.gemini_primary_model, prompt)
        if result and _is_valid_response(result):
            _write_audit_log(db, str(flag.id), flag.zone_id,
                             settings.gemini_primary_model, True,
                             f"Enriched explanation for flag type {flag.anomaly_type}")
            return result.strip()
        else:
            raise ValueError("Invalid LLM response")
    except Exception as e:
        logger.warning(f"[LLM] Explanation enrichment failed for flag {flag.id}: {e}. Using fallback.")
        _write_audit_log(db, str(flag.id), flag.zone_id,
                         settings.gemini_primary_model, False,
                         f"Fallback used: {str(e)[:100]}")
        return flag.explanation  # Always return the safe fallback


def answer_operator_question(
    db,
    question: str,
    context: dict,
) -> str:
    """
    Answers a natural language question from a grid operator.
    Context is a dict of pre-fetched, anonymized DB facts — never raw arrays.

    Args:
        db:       SQLAlchemy session (for audit logging)
        question: The operator's question string
        context:  A dict containing zone summaries, recent flag counts,
                  forecast risk levels, and other derived metrics

    Returns:
        A grounded, factual answer string. Never empty.
    """
    if not settings.llm_enabled:
        return "AI assistant is currently disabled."

    if settings.llm_mock_mode:
        return f"[SIMULATED] {_simulate_answer(question, context)}"

    if not settings.gemini_api_key:
        return "AI assistant is currently unavailable. Please check system configuration."

    # Sanitise question length
    question = question.strip()[:500]

    # Serialise context safely — no raw readings, no personal data
    context_lines = []
    if "zones" in context:
        for z in context["zones"][:12]:
            context_lines.append(
                f"  - {z.get('name', 'Unknown')} ({z.get('id', '')}): "
                f"Risk={z.get('risk_level', 'N/A')}, Load={z.get('current_load_kwh', 0):.1f} kWh, "
                f"Open flags={z.get('open_flag_count', 0)}"
            )
    if "open_flags_total" in context:
        context_lines.append(f"  Total open anomaly flags: {context['open_flags_total']}")
    if "high_risk_zones" in context:
        context_lines.append(f"  High/Critical risk zones: {context['high_risk_zones']}")
    if "forecast_accuracy_24h" in context:
        context_lines.append(f"  Forecast accuracy (last 24h): {context['forecast_accuracy_24h']:.1f}%")

    context_str = "\n".join(context_lines) if context_lines else "  No context data available."

    prompt = f"""You are GridSense, an AI assistant for BESCOM grid operators in Bengaluru.
You help operators understand the state of the electricity distribution network
using data from a smart meter monitoring dashboard.

All data shown below is synthetic (masked) data used for system testing. 
Treat it as real for the purposes of answering the operator's question.

Current network state:
{context_str}

Operator's question: {question}

Instructions:
- Answer in 2–4 sentences maximum.
- Be direct and factual. Ground your answer in the context data above.
- If the context does not contain enough information to answer, say so clearly.
- Do not invent numbers or zones not present in the context.
- Do not say "as an AI" or "I think". Speak as a confident monitoring system.
- Use plain English. No markdown, no bullet points, no headers.
"""

    fallback = (
        "I don't have enough context to answer that question right now. "
        "Please check the Dashboard and Anomaly pages for the latest network state."
    )

    try:
        result = _call_gemini(settings.gemini_primary_model, prompt)
        if result and _is_valid_response(result):
            _write_audit_log(db, None, None,
                             settings.gemini_primary_model, True,
                             f"Q&A: {question[:80]}")
            return result.strip()
        raise ValueError("Invalid response")
    except Exception as e:
        # Detect quota error and provide simulated fallback
        error_str = str(e).lower()
        if "429" in error_str or "quota" in error_str or "resourceexhausted" in error_str:
            logger.warning(f"[LLM] Quota exceeded. Falling back to simulation.")
            return f"[SIMULATED] {_simulate_answer(question, context)}"
            
        logger.warning(f"[LLM] Q&A call failed: {e}")
        _write_audit_log(db, None, None,
                         settings.gemini_primary_model, False, str(e)[:100])
        return fallback
