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
