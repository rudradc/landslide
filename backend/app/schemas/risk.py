from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class RiskConfigBase(BaseModel):
    weight_hazard: float = 0.30
    weight_vulnerability: float = 0.25
    weight_capacity: float = 0.20
    weight_infrastructure: float = 0.15
    weight_history: float = 0.10
    threshold_moderate: float = 25.0
    threshold_high: float = 50.0
    threshold_critical: float = 75.0

class RiskSummaryResponse(BaseModel):
    total_habitations: int
    critical_zones: int
    high_risk_zones: int
    moderate_risk_zones: int
    low_risk_zones: int
    overcapacity_habitations: int
    relocation_assessment_priority_count: int

class ValidationReportResponse(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    reasons: List[Dict[str, Any]]
