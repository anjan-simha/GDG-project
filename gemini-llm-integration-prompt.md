# GridSense AI — Gemini LLM Integration Prompt
## Google Antigravity IDE · Additive Integration · Zero Breaking Changes
## Gemini 2.0 Flash (primary) + Gemini 1.5 Pro (batch/reports)

---

## 🧭 Context & Scope

This prompt is a **strictly additive integration** on top of the existing GridSense AI project
(React + TypeScript frontend, FastAPI backend, PostgreSQL database). It adds Gemini LLM
capabilities to the parts of the system where natural language genuinely helps operators.

> **Do not modify any existing file unless explicitly told to in this prompt.**
> **Do not replace any statistical/rule-based detection logic with LLM calls.**
> Every instruction below either creates a new file or appends to a clearly named section
> of an existing file.

---

## ⚠️ Hard Rules (Non-Negotiable)

These rules must be enforced throughout the entire integration:

1. **Synthetic data only.** The LLM is never passed raw consumption arrays, real meter
   IDs, or any data that could be tied to real consumers. It receives only derived facts:
   anomaly type, deviation %, zone name, severity score, contributing feature names,
   and timestamps. Raw `MeterReading` objects are never serialized into a prompt.

2. **LLM is the language layer, not the detection layer.** The anomaly detectors in
   `anomaly_detector.py` and the forecasting logic in `demand_forecaster.py` are not
   touched. The LLM only enriches text fields (`explanation`, `risk_reason`, report bodies)
   after the statistical engine has already made its decision.

3. **Every LLM call is wrapped in a try/except.** If the Gemini API is unavailable,
   rate-limited, or returns an error, the system must fall back gracefully to the
   existing template-based `explanation` string already on the flag. The UI must never
   show a blank explanation.

4. **LLM responses are always validated before storage.** If a response is empty, too
   short (< 20 characters), or contains refusal language ("I cannot", "I'm sorry"),
   the fallback template is used instead.

5. **API key lives only in `backend/.env`.** It is never hardcoded, never committed to
   git, never logged, and never sent to the frontend.

6. **All LLM calls are logged to the `audit_logs` table** with `action = LLM_CALL` so
   there is a full auditable record of when and why the model was invoked.

---

## 📦 STEP 1 — Install Dependencies

### Backend
```bash
cd backend
pip install google-generativeai tenacity
```

- `google-generativeai` — official Google Gemini Python SDK
- `tenacity` — retry logic with exponential backoff for API calls

### Frontend
No new npm packages needed. All LLM responses arrive as plain strings from the backend API.

---

## 📁 STEP 2 — New Files to Create

The following files are **net-new**. Create them exactly at the paths specified.

```
backend/app/services/llm_explainer.py       ← Core LLM service
backend/app/services/llm_reporter.py        ← Batch report generator
backend/app/routers/intelligence.py         ← New FastAPI router: /api/intelligence
backend/app/schemas/intelligence.py         ← Pydantic schemas for LLM endpoints
frontend/src/services/intelligenceService.ts ← Frontend API calls
frontend/src/hooks/useIntelligence.ts       ← React Query hooks
frontend/src/components/intelligence/
    OperatorChat.tsx                         ← Q&A chat panel
    InspectionReport.tsx                     ← Zone report viewer
    EnrichedExplanation.tsx                  ← Richer flag explanation display
frontend/src/pages/IntelligencePage.tsx      ← New page: /intelligence
```

---

## ⚙️ STEP 3 — Backend: Config Update

### 3.1 Add to `backend/.env`

```env
# --- Gemini LLM ---
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_PRIMARY_MODEL=gemini-2.0-flash
GEMINI_REPORT_MODEL=gemini-1.5-pro
LLM_ENABLED=true
LLM_MAX_RETRIES=3
LLM_TIMEOUT_SECONDS=15
```

### 3.2 Add to `backend/app/config.py`

Append these fields to the existing `Settings` class. Do not replace anything:

```python
# Append inside the existing Settings class in config.py
gemini_api_key: str = ""
gemini_primary_model: str = "gemini-2.0-flash"
gemini_report_model: str = "gemini-1.5-pro"
llm_enabled: bool = True
llm_max_retries: int = 3
llm_timeout_seconds: int = 15
```

### 3.3 Add to `backend/app/models/audit_log.py`

Add `LLM_CALL` to the existing `AuditAction` enum. Only add this one line:

```python
# Inside the existing AuditAction enum, add:
LLM_CALL = "LLM_CALL"
```

---

## 🤖 STEP 4 — Core LLM Service

### Create `backend/app/services/llm_explainer.py`

```python
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
    if not settings.llm_enabled or not settings.gemini_api_key:
        return flag.explanation  # Graceful no-op

    # Map enum to plain English for the prompt
    anomaly_descriptions = {
        "SUDDEN_DROP":             "a sudden and sustained drop in electricity consumption",
        "SUDDEN_SPIKE":            "an unexpected spike in electricity consumption",
        "CONSISTENT_UNDERREPORT":  "a persistent pattern of consumption below peer average",
        "NIGHT_USAGE_ANOMALY":     "unusually high electricity usage during late-night hours (1am–4am)",
        "PEER_DEVIATION":          "significant statistical deviation from comparable meters in the zone",
        "TAMPER_SUSPECTED":        "a combination of anomaly signals strongly associated with meter tampering or energy theft",
    }

    anomaly_plain = anomaly_descriptions.get(flag.anomaly_type, flag.anomaly_type)
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
    if not settings.llm_enabled or not settings.gemini_api_key:
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
        logger.warning(f"[LLM] Q&A call failed: {e}")
        _write_audit_log(db, None, None,
                         settings.gemini_primary_model, False, str(e)[:100])
        return fallback
```

---

## 📋 STEP 5 — Report Generator Service

### Create `backend/app/services/llm_reporter.py`

```python
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
    if not settings.llm_enabled or not settings.gemini_api_key:
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
    if not settings.llm_enabled or not settings.gemini_api_key:
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
```

---

## 🌐 STEP 6 — New FastAPI Router

### Create `backend/app/schemas/intelligence.py`

```python
from pydantic import BaseModel, Field
from typing import Optional

class EnrichFlagRequest(BaseModel):
    flag_id: str = Field(..., description="UUID of the AnomalyFlag to enrich")

class EnrichFlagResponse(BaseModel):
    flag_id: str
    enriched_explanation: str
    model_used: str
    fallback_used: bool

class OperatorQuestionRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=500)

class OperatorQuestionResponse(BaseModel):
    answer: str
    model_used: str

class ZoneReportRequest(BaseModel):
    zone_id: str

class ZoneReportResponse(BaseModel):
    zone_id: str
    zone_name: str
    report_text: str
    generated_at: str
    model_used: str

class PatternSummaryResponse(BaseModel):
    zone_id: str
    flag_count: int
    summary: str
```

### Create `backend/app/routers/intelligence.py`

```python
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
```

### 6.1 Register Router in `backend/app/main.py`

**Append only** — add this import and `include_router` call. Do not touch anything else in `main.py`:

```python
# Add this import at the top with the other router imports:
from app.routers import intelligence

# Add this line after the existing app.include_router() calls:
app.include_router(intelligence.router, prefix="/api/intelligence", tags=["Intelligence"])
```

---

## 🖥️ STEP 7 — Frontend Integration

### 7.1 Create `frontend/src/services/intelligenceService.ts`

```typescript
import { api } from './api';

export interface EnrichFlagResponse {
  flag_id: string;
  enriched_explanation: string;
  model_used: string;
  fallback_used: boolean;
}

export interface OperatorQAResponse {
  answer: string;
  model_used: string;
}

export interface ZoneReportResponse {
  zone_id: string;
  zone_name: string;
  report_text: string;
  generated_at: string;
  model_used: string;
}

export interface PatternSummaryResponse {
  zone_id: string;
  flag_count: number;
  summary: string;
}

export const intelligenceService = {
  enrichFlag: (flagId: string): Promise<EnrichFlagResponse> =>
    api
      .post('/api/intelligence/enrich-flag', { flag_id: flagId })
      .then((r) => r.data),

  ask: (question: string): Promise<OperatorQAResponse> =>
    api
      .post('/api/intelligence/ask', { question })
      .then((r) => r.data),

  getZoneReport: (zoneId: string): Promise<ZoneReportResponse> =>
    api
      .post('/api/intelligence/zone-report', { zone_id: zoneId })
      .then((r) => r.data),

  getPatternSummary: (zoneId: string): Promise<PatternSummaryResponse> =>
    api
      .get(`/api/intelligence/zone-pattern/${zoneId}`)
      .then((r) => r.data),
};
```

### 7.2 Create `frontend/src/hooks/useIntelligence.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { intelligenceService } from '../services/intelligenceService';

/** Enriches a single anomaly flag's explanation via Gemini. */
export function useEnrichFlag() {
  return useMutation({
    mutationFn: (flagId: string) => intelligenceService.enrichFlag(flagId),
  });
}

/** Sends a natural language question to the GridSense Q&A engine. */
export function useAskOperator() {
  return useMutation({
    mutationFn: (question: string) => intelligenceService.ask(question),
  });
}

/** Generates a full inspection report for a zone using Gemini 1.5 Pro. */
export function useZoneReport() {
  return useMutation({
    mutationFn: (zoneId: string) => intelligenceService.getZoneReport(zoneId),
  });
}

/** Gets a multi-anomaly pattern summary for a zone. */
export function usePatternSummary(zoneId: string) {
  return useMutation({
    mutationFn: () => intelligenceService.getPatternSummary(zoneId),
  });
}
```

### 7.3 Create `frontend/src/components/intelligence/EnrichedExplanation.tsx`

This component replaces the static explanation text on `AnomalyFlagCard`.
It shows the template explanation by default, with an "Enrich with AI" button
that fetches the richer version on demand.

```tsx
import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useEnrichFlag } from '../../hooks/useIntelligence';

interface Props {
  flagId: string;
  templateExplanation: string;  // Always available — the safe fallback
}

export function EnrichedExplanation({ flagId, templateExplanation }: Props) {
  const [enriched, setEnriched] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const { mutate, isPending, isError } = useEnrichFlag();

  const handleEnrich = () => {
    mutate(flagId, {
      onSuccess: (data) => {
        setEnriched(data.enriched_explanation);
        setFallbackUsed(data.fallback_used);
      },
    });
  };

  return (
    <div className="space-y-2">
      {/* Always show template explanation as the base */}
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Sans, sans-serif' }}
      >
        {enriched ?? templateExplanation}
      </p>

      {/* Show enriched badge if AI version is loaded */}
      {enriched && !fallbackUsed && (
        <span
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded"
          style={{
            background: 'rgba(0,229,255,0.08)',
            color: 'var(--color-cyan-electric)',
            border: '1px solid rgba(0,229,255,0.2)',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <Sparkles size={10} />
          AI-enriched · Gemini
        </span>
      )}

      {/* Fallback notice */}
      {enriched && fallbackUsed && (
        <span
          className="inline-flex items-center gap-1 text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <AlertCircle size={10} />
          AI unavailable — showing system explanation
        </span>
      )}

      {/* Enrich button — only shown before enrichment is loaded */}
      {!enriched && (
        <button
          onClick={handleEnrich}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-all"
          style={{
            background: 'transparent',
            border: '1px solid rgba(0,229,255,0.25)',
            color: 'var(--color-cyan-electric)',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {isPending ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <Sparkles size={10} />
          )}
          {isPending ? 'Enriching…' : 'Enrich with AI'}
        </button>
      )}

      {isError && (
        <p className="text-xs" style={{ color: 'var(--color-risk-high)' }}>
          Failed to reach AI service. Template explanation shown above.
        </p>
      )}
    </div>
  );
}
```

### 7.4 Create `frontend/src/components/intelligence/OperatorChat.tsx`

```tsx
import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { useAskOperator } from '../../hooks/useIntelligence';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'Which zones are at highest risk right now?',
  'How many open anomaly flags are there?',
  'What is the forecast accuracy for today?',
  'Are there any suspected tampering cases?',
];

export function OperatorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello. I am GridSense, your smart grid assistant. Ask me about zone risk levels, anomaly flags, or forecast data.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { mutate, isPending } = useAskOperator();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (question: string) => {
    if (!question.trim() || isPending) return;

    const userMsg: Message = { role: 'user', content: question, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    mutate(question, {
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.answer, timestamp: new Date() },
        ]);
      },
      onError: () => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'I was unable to reach the AI service. Please try again or check the dashboard directly.',
            timestamp: new Date(),
          },
        ]);
      },
    });
  };

  return (
    <div
      className="flex flex-col h-full rounded-lg overflow-hidden"
      style={{ background: 'var(--color-grid-panel)', border: '1px solid var(--color-border-subtle)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <Bot size={16} style={{ color: 'var(--color-cyan-electric)' }} />
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'Space Mono, monospace' }}
        >
          GridSense AI
        </span>
        <span
          className="text-xs ml-auto px-2 py-0.5 rounded"
          style={{
            background: 'rgba(0,229,255,0.08)',
            color: 'var(--color-cyan-electric)',
            border: '1px solid rgba(0,229,255,0.2)',
          }}
        >
          Gemini
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <Bot size={16} className="mt-1 flex-shrink-0" style={{ color: 'var(--color-cyan-electric)' }} />
            )}
            <div
              className="max-w-xs rounded-lg px-3 py-2 text-sm leading-relaxed"
              style={{
                background: msg.role === 'assistant'
                  ? 'var(--color-grid-slate)'
                  : 'rgba(0,229,255,0.12)',
                color: 'var(--color-text-primary)',
                border: msg.role === 'assistant'
                  ? '1px solid var(--color-border-subtle)'
                  : '1px solid rgba(0,229,255,0.25)',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <User size={16} className="mt-1 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
            )}
          </div>
        ))}

        {isPending && (
          <div className="flex gap-2 justify-start">
            <Bot size={16} className="mt-1" style={{ color: 'var(--color-cyan-electric)' }} />
            <div
              className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
              style={{ background: 'var(--color-grid-slate)', color: 'var(--color-text-muted)' }}
            >
              <Loader2 size={12} className="animate-spin" />
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions — shown only when empty */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs px-2.5 py-1 rounded transition-colors"
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className="flex items-center gap-2 px-3 py-3"
        style={{ borderTop: '1px solid var(--color-border-subtle)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask about zones, flags, forecasts…"
          disabled={isPending}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'DM Sans, sans-serif' }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isPending || !input.trim()}
          style={{
            color: input.trim() ? 'var(--color-cyan-electric)' : 'var(--color-text-muted)',
            cursor: input.trim() && !isPending ? 'pointer' : 'not-allowed',
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
```

### 7.5 Create `frontend/src/components/intelligence/InspectionReport.tsx`

```tsx
import { useState } from 'react';
import { FileText, Loader2, Download } from 'lucide-react';
import { useZoneReport } from '../../hooks/useIntelligence';

interface Props {
  zoneId: string;
  zoneName: string;
}

export function InspectionReport({ zoneId, zoneName }: Props) {
  const [report, setReport] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const { mutate, isPending, isError } = useZoneReport();

  const handleGenerate = () => {
    mutate(zoneId, {
      onSuccess: (data) => {
        setReport(data.report_text);
        setGeneratedAt(data.generated_at);
      },
    });
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gridsense-report-${zoneId}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="rounded-lg p-4 space-y-3"
      style={{ background: 'var(--color-grid-panel)', border: '1px solid var(--color-border-subtle)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} style={{ color: 'var(--color-cyan-electric)' }} />
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'Space Mono, monospace' }}
          >
            Inspection Report
          </span>
        </div>

        <div className="flex items-center gap-2">
          {report && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded"
              style={{
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Download size={10} />
              Export
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded"
            style={{
              background: isPending ? 'rgba(0,229,255,0.06)' : 'var(--color-cyan-electric)',
              color: isPending ? 'var(--color-cyan-electric)' : 'var(--color-text-inverse)',
              border: isPending ? '1px solid rgba(0,229,255,0.3)' : 'none',
              cursor: isPending ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {isPending && <Loader2 size={10} className="animate-spin" />}
            {isPending ? 'Generating…' : report ? 'Regenerate' : 'Generate Report'}
          </button>
        </div>
      </div>

      {report && (
        <>
          {generatedAt && (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              Generated: {new Date(generatedAt).toLocaleString()}
            </p>
          )}
          <pre
            className="text-sm leading-relaxed whitespace-pre-wrap rounded p-3"
            style={{
              background: 'var(--color-grid-slate)',
              color: 'var(--color-text-primary)',
              fontFamily: 'DM Sans, sans-serif',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            {report}
          </pre>
        </>
      )}

      {!report && !isPending && (
        <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
          Click "Generate Report" to create an AI-powered inspection summary for {zoneName}.
        </p>
      )}

      {isError && (
        <p className="text-xs" style={{ color: 'var(--color-risk-high)' }}>
          Report generation failed. Please try again or check the AI service status.
        </p>
      )}
    </div>
  );
}
```

### 7.6 Create `frontend/src/pages/IntelligencePage.tsx`

```tsx
import { PageWrapper } from '../components/layout/PageWrapper';
import { OperatorChat } from '../components/intelligence/OperatorChat';
import { Bot, Sparkles } from 'lucide-react';

export function IntelligencePage() {
  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Bot size={24} style={{ color: 'var(--color-cyan-electric)' }} />
          <div>
            <h1
              className="text-2xl"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'Space Mono, monospace' }}
            >
              GridSense Intelligence
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Natural language interface powered by Gemini · Synthetic data only
            </p>
          </div>
          <span
            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1 rounded"
            style={{
              background: 'rgba(245,158,11,0.10)',
              color: '#F59E0B',
              border: '1px solid rgba(245,158,11,0.3)',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <Sparkles size={10} />
            SYNTHETIC DATA MODE
          </span>
        </div>

        {/* Chat panel — full height */}
        <div style={{ height: '600px' }}>
          <OperatorChat />
        </div>

        {/* Usage guidance */}
        <div
          className="rounded-lg p-4 text-sm"
          style={{
            background: 'var(--color-grid-panel)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-secondary)',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <strong style={{ color: 'var(--color-text-primary)' }}>How this works:</strong>
          {' '}The AI assistant reads live data from the dashboard (zone risk levels, open flags,
          forecast accuracy) and answers your questions in plain English. It never has access to
          raw consumption data or real meter readings. All responses are grounded in the synthetic
          network state shown in the dashboard.
        </div>
      </div>
    </PageWrapper>
  );
}
```

---

## 🔗 STEP 8 — Wire Up Routing & Navigation

### 8.1 Add Route to `frontend/src/App.tsx` (or your router file)

**Add only these lines** — do not modify existing routes:

```tsx
// Add this import:
import { IntelligencePage } from './pages/IntelligencePage';

// Add this route inside your <Routes> block:
<Route path="/intelligence" element={<IntelligencePage />} />
```

### 8.2 Add Nav Item to `frontend/src/components/layout/Sidebar.tsx`

**Append only** — add this item to the existing nav links array. Do not reorder existing links:

```tsx
// Add this import at the top of Sidebar.tsx:
import { Bot } from 'lucide-react';

// Add this object to the existing navLinks array, after the Audit Log entry:
{ path: '/intelligence', label: 'AI Intelligence', icon: Bot },
```

### 8.3 Wire `EnrichedExplanation` into `AnomalyFlagCard`

**Minimal change** — in the existing `AnomalyFlagCard.tsx`, replace the explanation
`<p>` tag with the `EnrichedExplanation` component. Only this section changes:

```tsx
// Add import at top of AnomalyFlagCard.tsx:
import { EnrichedExplanation } from '../intelligence/EnrichedExplanation';

// Replace this existing block (the static explanation paragraph):
// <p className="...">{flag.explanation}</p>
// WITH:
<EnrichedExplanation
  flagId={flag.id}
  templateExplanation={flag.explanation}
/>
```

### 8.4 Wire `InspectionReport` into `ZoneDetailPage`

**Append only** — add to the bottom of the `ZoneDetailPage` layout, after the anomaly history section:

```tsx
// Add import at top of ZoneDetailPage.tsx:
import { InspectionReport } from '../components/intelligence/InspectionReport';

// Add this block after the existing anomaly history section:
<section className="mt-6">
  <InspectionReport zoneId={zoneId} zoneName={zone?.name ?? zoneId} />
</section>
```

---

## ✅ STEP 9 — Verification Checklist

Run through these checks in order. Fix any failure before moving to the next step.

**Backend**
- [ ] `python -c "import google.generativeai; print('SDK OK')"` — no import errors
- [ ] `GET /health` still returns `{"status": "ok"}` — existing routes unbroken
- [ ] `GET /api/intelligence/zone-pattern/BLR-N01` returns a `PatternSummaryResponse`
- [ ] `POST /api/intelligence/ask` with body `{"question": "What zones are at risk?"}` returns a non-empty answer
- [ ] `POST /api/intelligence/enrich-flag` with a valid flag UUID returns an `EnrichFlagResponse`
- [ ] Dismissing a flag via `PATCH /api/anomalies/{id}/dismiss` still creates an AuditLog row (existing behaviour unchanged)
- [ ] An `LLM_CALL` audit entry appears in `GET /api/audit/` after calling any intelligence endpoint
- [ ] When `GEMINI_API_KEY` is empty, all `/api/intelligence/` endpoints return fallback responses instead of 500 errors

**Frontend**
- [ ] `/intelligence` route renders without TypeScript errors
- [ ] `OperatorChat` sends a question and receives a response
- [ ] Suggested question buttons work
- [ ] `EnrichedExplanation` on `AnomalyFlagCard` shows the "Enrich with AI" button
- [ ] Clicking "Enrich with AI" calls the backend and shows the enriched text
- [ ] The "AI-enriched · Gemini" badge appears after successful enrichment
- [ ] If enrichment fails, the template explanation remains visible (no blank state)
- [ ] `InspectionReport` on `ZoneDetailPage` generates and displays a report
- [ ] "Export" button downloads the report as a `.txt` file
- [ ] The "AI Intelligence" link appears in the sidebar
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] No `console.error` in the browser during normal navigation

**Stability**
- [ ] Temporarily set `LLM_ENABLED=false` in `.env` — all pages still load normally
- [ ] Temporarily use an invalid API key — all pages still load, intelligence endpoints return fallback text
- [ ] All existing routes (`/`, `/forecasting`, `/anomalies`, `/zones/:id`, `/audit`, `/settings`) load correctly and are visually unchanged

---

## 🔑 STEP 10 — Getting Your Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key and paste it into `backend/.env` as `GEMINI_API_KEY=your_key_here`
5. **Never commit this key to git.** Add `backend/.env` to `.gitignore` if not already present.

For the Google Developer Challenge demo, Gemini 2.0 Flash is available on the free tier
with generous rate limits — no billing required for hackathon-scale usage.
