"""
Vercel Python Serverless entry point for GridSense AI backend.

Vercel detects the `app` export and serves it as an ASGI function.
All requests to /api/* are routed here via vercel.json rewrites.

The backend/ directory is added to sys.path so all existing
FastAPI routers, models, and services import without modification.
"""
import sys
import os

# ── Make backend/ importable from the repo root ───────────────────────────────
_backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
sys.path.insert(0, _backend_dir)

# ── Vercel filesystem: only /tmp is writable ──────────────────────────────────
# SQLite data resets on cold-start, which is fine for synthetic-data demo mode.
os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/gridsense.db")
os.environ.setdefault("ENVIRONMENT", "production")
os.environ.setdefault("ALLOWED_ORIGINS", "*")
os.environ.setdefault("SYNTHETIC_DATA_BANNER", "true")
os.environ.setdefault("LLM_MOCK_MODE", "false")

# ── Import the FastAPI app (ASGI) ─────────────────────────────────────────────
from app.main import app  # noqa: E402  (import after sys.path patch)
