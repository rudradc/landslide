from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class RelocationSiteBase(BaseModel):
    site_code: str
    name: str
    district: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    available_land_sq_km: float = 5.0
    target_population_capacity: int = 5000
    water_availability_index: float = 85.0
    road_connectivity_index: float = 80.0
    distance_from_hazard_zone_m: float = 10000.0
    environmental_suitability_index: float = 85.0

class RelocationSiteCreate(RelocationSiteBase):
    pass

class RelocationSiteResponse(RelocationSiteBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class RecommendationResponse(BaseModel):
    id: str
    habitation_id: str
    relocation_site_id: str
    suitability_score: float
    rank_order: int
    suitability_tier: str
    rationale: Dict[str, Any]
    relocation_site: RelocationSiteResponse

    class Config:
        from_attributes = True
