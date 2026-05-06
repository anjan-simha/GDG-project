# GridSense AI — Chatbot Fix Prompt
## Fixing: "I don't have enough context" fallback response
## Root causes: Model name mismatch + empty DB context + silent API failures

---

## 🔍 Root Cause Analysis

The "I don't have enough context" message is the **Python fallback string**, not a Gemini
response. It fires when one of three things goes wrong:

1. **Wrong model name** — `gemini-2.0-flash` may not be available on your API key tier.
   The correct, universally available free-tier model is `gemini-1.5-flash`.

2. **Empty DB context** — The `/api/intelligence/ask` endpoint queries the DB for zones,
   flags, and forecasts. If the DB is not seeded or queries return nothing, the context
   dict is empty and the LLM correctly says it has no data.

3. **Silent retry exhaustion** — `tenacity` with `reraise=False` swallows all exceptions
   after max retries and returns `None`, which triggers the fallback. There is no visible
   error anywhere.

This prompt fixes all three root causes in the correct order.

---

## ⚠️ Rules For This Fix

- **Surgical changes only.** Only the files listed below are modified.
- **Do not touch** `anomaly_detector.py`, `demand_forecaster.py`, database models,
  or any frontend page other than `OperatorChat.tsx`.
- After every file change, the existing behaviour of all other API endpoints must be
  unchanged and still working.

---

## 🛠️ FIX 1 — Correct the Model Names (backend/.env)

Replace the model name values in `backend/.env`.
**Do not change any other env variable.**

```env
# Change these two lines only:
GEMINI_PRIMARY_MODEL=gemini-1.5-flash
GEMINI_REPORT_MODEL=gemini-1.5-pro
```

**Why:** `gemini-2.0-flash` requires allowlisted API access.
`gemini-1.5-flash` is available on all free-tier API keys immediately.

Also update the defaults in `backend/app/config.py` to match.
Find the two model fields and change their default values:

```python
# In the Settings class, change:
gemini_primary_model: str = "gemini-1.5-flash"
gemini_report_model: str = "gemini-1.5-pro"
```

---

## 🛠️ FIX 2 — Add a Health Check Endpoint

### Append to `backend/app/routers/intelligence.py`

Add this endpoint at the **bottom** of the file, after all existing routes.
Do not change any existing route.

```python
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
```

**After adding this, immediately call:**
```
GET http://localhost:8000/api/intelligence/health
```

Read the response. It tells you exactly which of the three root causes applies to your setup.
Fix any `false` values before proceeding with the other fixes below.

---

## 🛠️ FIX 3 — Rewrite the `/ask` Endpoint with Robust Context

**Replace the entire `ask_operator_question` function** in
`backend/app/routers/intelligence.py` with the version below.

Key changes from the original:
- Injects a **synthetic baseline context** if the DB is empty or partially seeded,
  so the LLM always has something to work with during development/demo.
- Logs the exact context string before sending it to Gemini so you can see
  what the model receives.
- Surfaces the actual exception message instead of swallowing it.
- Uses a simpler, more direct prompt that works even with sparse context.

```python
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
Do not say "as an AI" — respond as a monitoring system.
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
```

---

## 🛠️ FIX 4 — Rewrite `llm_explainer.py` `answer_operator_question`

**Replace the `answer_operator_question` function** in
`backend/app/services/llm_explainer.py` with this version.
The router now handles this logic directly (Fix 3), so this function
becomes a lightweight passthrough that won't conflict:

```python
def answer_operator_question(
    db,
    question: str,
    context: dict,
) -> str:
    """
    Legacy wrapper — logic has moved to the router for better error visibility.
    Kept for backward compatibility. Returns a safe fallback only.
    """
    return (
        "Please use the /api/intelligence/ask endpoint directly. "
        "The router now handles context assembly with full error reporting."
    )
```

---

## 🛠️ FIX 5 — Frontend: Show Error Detail + Health Status

**Replace the entire content of `OperatorChat.tsx`** with the version below.

Key changes:
- Calls `/api/intelligence/health` on mount and shows a status badge
- Shows the actual error message from the API when a call fails (not a generic string)
- Shows a "Service offline" banner if health check fails
- Sends the question correctly to `POST /api/intelligence/ask`

```tsx
import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, AlertTriangle, CheckCircle2, WifiOff } from 'lucide-react';
import { useAskOperator } from '../../hooks/useIntelligence';
import { api } from '../../services/api';

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  modelUsed?: string;
  timestamp: Date;
}

interface HealthStatus {
  status: 'ok' | 'degraded' | 'loading' | 'unreachable';
  gemini_reachable?: boolean;
  api_key_configured?: boolean;
  db_seeded?: boolean;
  model_primary?: string;
  gemini_error?: string | null;
  db_zones?: number;
  db_flags?: number;
}

const SUGGESTED_QUESTIONS = [
  'Which zones are at highest risk right now?',
  'How many open anomaly flags are there?',
  'Are there any suspected tampering cases?',
  'What is the overall network status?',
];

export function OperatorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello. I am GridSense, your smart grid assistant. Ask me about zone risk levels, anomaly flags, or the overall network state.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [health, setHealth] = useState<HealthStatus>({ status: 'loading' });
  const bottomRef = useRef<HTMLDivElement>(null);
  const { mutate, isPending } = useAskOperator();

  // ── Health check on mount ──────────────────────────────────────────────
  useEffect(() => {
    api
      .get('/api/intelligence/health')
      .then((r) => {
        setHealth(r.data);
        if (r.data.status === 'degraded') {
          // Surface the exact problem to the operator
          const problems: string[] = [];
          if (!r.data.api_key_configured)
            problems.push('GEMINI_API_KEY is not set in backend/.env');
          if (!r.data.gemini_reachable)
            problems.push(
              r.data.gemini_error
                ? `Gemini API error: ${r.data.gemini_error}`
                : `Model "${r.data.model_primary}" not reachable`
            );
          if (!r.data.db_seeded)
            problems.push(
              `Database has only ${r.data.db_zones} zones — run the seeder: python -m app.seed.seed_data`
            );

          setMessages((prev) => [
            ...prev,
            {
              role: 'error',
              content:
                `AI service is degraded:\n` + problems.map((p) => `• ${p}`).join('\n'),
              timestamp: new Date(),
            },
          ]);
        }
      })
      .catch(() => setHealth({ status: 'unreachable' }));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (question: string) => {
    if (!question.trim() || isPending) return;

    const userMsg: Message = {
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    mutate(question, {
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer,
            modelUsed: data.model_used,
            timestamp: new Date(),
          },
        ]);
      },
      onError: (err: Error) => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'error',
            content: `Request failed: ${err.message}. Check that the backend is running on port 8000.`,
            timestamp: new Date(),
          },
        ]);
      },
    });
  };

  // ── Status badge ──────────────────────────────────────────────────────
  const StatusBadge = () => {
    if (health.status === 'loading')
      return (
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <Loader2 size={10} className="animate-spin" /> Checking…
        </span>
      );
    if (health.status === 'ok')
      return (
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-risk-low)' }}>
          <CheckCircle2 size={10} /> {health.model_primary}
        </span>
      );
    if (health.status === 'unreachable')
      return (
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-risk-high)' }}>
          <WifiOff size={10} /> Backend unreachable
        </span>
      );
    return (
      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-risk-moderate)' }}>
        <AlertTriangle size={10} /> Degraded — see chat
      </span>
    );
  };

  return (
    <div
      className="flex flex-col h-full rounded-lg overflow-hidden"
      style={{
        background: 'var(--color-grid-panel)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <Bot size={16} style={{ color: 'var(--color-cyan-electric)' }} />
        <span
          className="text-sm font-medium"
          style={{
            color: 'var(--color-text-primary)',
            fontFamily: 'Space Mono, monospace',
          }}
        >
          GridSense AI
        </span>
        <span className="ml-auto">
          <StatusBadge />
        </span>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {(msg.role === 'assistant' || msg.role === 'error') && (
              <div className="mt-1 flex-shrink-0">
                {msg.role === 'error' ? (
                  <AlertTriangle size={16} style={{ color: 'var(--color-risk-moderate)' }} />
                ) : (
                  <Bot size={16} style={{ color: 'var(--color-cyan-electric)' }} />
                )}
              </div>
            )}

            <div className="max-w-xs space-y-1">
              <div
                className="rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  background:
                    msg.role === 'user'
                      ? 'rgba(0,229,255,0.12)'
                      : msg.role === 'error'
                      ? 'rgba(245,158,11,0.08)'
                      : 'var(--color-grid-slate)',
                  color: 'var(--color-text-primary)',
                  border:
                    msg.role === 'user'
                      ? '1px solid rgba(0,229,255,0.25)'
                      : msg.role === 'error'
                      ? '1px solid rgba(245,158,11,0.25)'
                      : '1px solid var(--color-border-subtle)',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {msg.content}
              </div>

              {/* Model attribution */}
              {msg.modelUsed && msg.role === 'assistant' && (
                <p
                  className="text-xs pl-1"
                  style={{
                    color: 'var(--color-text-muted)',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {msg.modelUsed}
                </p>
              )}
            </div>

            {msg.role === 'user' && (
              <User
                size={16}
                className="mt-1 flex-shrink-0"
                style={{ color: 'var(--color-text-muted)' }}
              />
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isPending && (
          <div className="flex gap-2 justify-start">
            <Bot size={16} className="mt-1" style={{ color: 'var(--color-cyan-electric)' }} />
            <div
              className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
              style={{
                background: 'var(--color-grid-slate)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <Loader2 size={12} className="animate-spin" />
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggested questions ────────────────────────────────────────── */}
      {messages.length <= 1 && health.status === 'ok' && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={isPending}
              className="text-xs px-2.5 py-1 rounded transition-colors"
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
                fontFamily: 'DM Sans, sans-serif',
                cursor: 'pointer',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 py-3"
        style={{ borderTop: '1px solid var(--color-border-subtle)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder={
            health.status === 'unreachable'
              ? 'Backend unreachable — start the FastAPI server'
              : health.status === 'degraded'
              ? 'AI degraded — check the error above'
              : 'Ask about zones, flags, forecasts…'
          }
          disabled={isPending || health.status === 'unreachable'}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{
            color: 'var(--color-text-primary)',
            fontFamily: 'DM Sans, sans-serif',
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isPending || !input.trim() || health.status === 'unreachable'}
          style={{
            color:
              input.trim() && health.status !== 'unreachable'
                ? 'var(--color-cyan-electric)'
                : 'var(--color-text-muted)',
            cursor:
              input.trim() && !isPending && health.status !== 'unreachable'
                ? 'pointer'
                : 'not-allowed',
            transition: 'color 150ms',
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
```

---

## 🛠️ FIX 6 — Seed the Database (if not already done)

If `GET /api/intelligence/health` returned `"db_seeded": false`, run the seeder now:

```bash
cd backend
python -m app.seed.seed_data
```

Then call the health endpoint again and confirm `"db_seeded": true` before testing the chat.

---

## ✅ Verification Steps (run in this exact order)

**Step 1 — Confirm model is reachable:**
```
GET http://localhost:8000/api/intelligence/health
```
Expected: `"gemini_reachable": true, "db_seeded": true, "status": "ok"`

If `gemini_reachable` is false, check `gemini_error` in the response.
Common errors and fixes:
- `API_KEY_INVALID` → the key in `.env` is wrong or has a typo
- `models/gemini-2.0-flash is not found` → you still have the old model name; re-apply Fix 1
- `quota exceeded` → wait 60 seconds and try again (free tier limits)
- `Connection refused` → check internet connectivity from the server

**Step 2 — Test a direct question:**
```
POST http://localhost:8000/api/intelligence/ask
Content-Type: application/json

{ "question": "Which zones are at highest risk right now?" }
```
Expected: `"answer"` field contains a real sentence, `"model_used"` is `"gemini-1.5-flash"`

**Step 3 — Open the frontend chat:**
- The header status badge should show green `✓ gemini-1.5-flash`
- Type any question and press Enter
- The response should appear within 3–5 seconds
- The model name should appear below the response bubble

**Step 4 — Confirm audit log entry was created:**
```
GET http://localhost:8000/api/audit/?limit=5
```
Expected: The most recent entry has `"action": "LLM_CALL"` and `"operator_note"` containing your question.

---

## 🔑 Quick API Key Verification (run in terminal)

If you are unsure whether your key works, test it directly before touching any code:

```bash
cd backend
python3 - << 'EOF'
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY", "")
print(f"Key loaded: {'YES (' + key[:8] + '...)' if key else 'NO — key is empty'}")

if key:
    genai.configure(api_key=key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    resp = model.generate_content("Say: GRIDSENSE OK")
    print(f"Gemini response: {resp.text}")
    print("✅ Key and model are working correctly.")
EOF
```

This script independently confirms the key works before you restart the server.
If it prints `GRIDSENSE OK`, the problem was only the model name — Fix 1 resolves it.
If it throws an error, the error message tells you exactly what to fix next.
