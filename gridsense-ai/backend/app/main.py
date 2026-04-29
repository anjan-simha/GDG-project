from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import engine, Base
from app.routers import zones, meters, forecasts, anomalies, dashboard, audit, intelligence

# We need to import all models so SQLAlchemy knows about them before create_all
import app.models.zone
import app.models.meter
import app.models.meter_reading
import app.models.anomaly_flag
import app.models.demand_forecast
import app.models.audit_log

settings = get_settings()

# Create all tables (use alembic in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GridSense AI API",
    description="BESCOM Smart Meter Intelligence & Loss Detection",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(zones.router,     prefix="/api/zones",     tags=["Zones"])
app.include_router(meters.router,    prefix="/api/meters",    tags=["Meters"])
app.include_router(forecasts.router, prefix="/api/forecasts", tags=["Forecasts"])
app.include_router(anomalies.router, prefix="/api/anomalies", tags=["Anomalies"])
app.include_router(audit.router,     prefix="/api/audit",     tags=["Audit"])
app.include_router(intelligence.router, prefix="/api/intelligence", tags=["Intelligence"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "GridSense AI", "synthetic_mode": True}

@app.on_event("startup")
async def startup_event():
    print("\n" + "="*60)
    print("  [GRIDSENSE AI] Running on SYNTHETIC data only.")
    print("  No real BESCOM meter data is in use.")
    print("="*60 + "\n")
