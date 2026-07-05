from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ChatRequest(BaseModel):
    query: str

class AgentTraceItem(BaseModel):
    agent_name: str
    reason: str
    decision: str

class ChatResponse(BaseModel):
    answer: str
    agent_trace: List[AgentTraceItem]
    sources: List[str]

class HealthReportResponse(BaseModel):
    extracted_values: Dict[str, Any]
    explanation: str
    why: str
    guidelines_used: List[str]

class CommunityTrendItem(BaseModel):
    week: str
    cases: int
    rainfall_mm: float

class HealthCommunityResponse(BaseModel):
    ward: str
    historical_trends: List[CommunityTrendItem]
    predicted_risk: str
    recommendations: List[str]
    why: str

class EnvCurrentResponse(BaseModel):
    city: str
    aqi: float
    aqi_us: float
    aqi_cpcb: float
    temperature: float
    rainfall: float
    category: str
    is_safe: bool
    recommendations: List[str]
    why: str

class AQITrendItem(BaseModel):
    date: str
    aqi: float

class EnvForecastResponse(BaseModel):
    city: str
    historical: List[AQITrendItem]
    forecast: List[AQITrendItem]
    why: str

class ComplaintCreate(BaseModel):
    description: str

class ComplaintResponse(BaseModel):
    id: int
    description: str
    category: str
    severity: str
    suggested_routing: str
    why: str
    created_at: str
