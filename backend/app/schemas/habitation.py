from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class HabitationBase(BaseModel):
    habitation_code: str
    name: str
    district: str
    state: str = "Uttarakhand"
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    population: int = Field(..., ge=0)
    households: int = Field(..., ge=0)
    area_sq_km: float = Field(..., gt=0)
    elevation_m: Optional[float] = 1000.0
    slope_deg: Optional[float] = 15.0
    aspect: Optional[str] = "North"
    soil_type: Optional[str] = "Clay-Loam"
    land_use: Optional[str] = "Residential"
    annual_rainfall_mm: Optional[float] = 1500.0
    distance_to_river_m: Optional[float] = 1000.0
    distance_to_road_m: Optional[float] = 500.0
    distance_to_hospital_m: Optional[float] = 5000.0
    water_availability_index: Optional[float] = 70.0
    housing_quality_index: Optional[float] = 60.0
    safe_land_area_sq_km: Optional[float] = 0.5
    water_capacity_persons: Optional[int] = 2000
    healthcare_capacity_persons: Optional[int] = 1500
    road_capacity_persons: Optional[int] = 3000
    flood_history_count: Optional[int] = 0
    landslide_history_count: Optional[int] = 0

class HabitationCreate(HabitationBase):
    pass

class HabitationUpdate(BaseModel):
    name: Optional[str] = None
    population: Optional[int] = None
    households: Optional[int] = None
    slope_deg: Optional[float] = None
    annual_rainfall_mm: Optional[float] = None
    distance_to_river_m: Optional[float] = None
    distance_to_road_m: Optional[float] = None
    distance_to_hospital_m: Optional[float] = None

class HazardSchema(BaseModel):
    landslide_score: float
    flood_score: float
    earthquake_score: float
    rainfall_hazard_score: float
    composite_hazard_score: float

    class Config:
        from_attributes = True

class VulnerabilitySchema(BaseModel):
    social_vulnerability: float
    structural_vulnerability: float
    accessibility_vulnerability: float
    composite_vulnerability_score: float

    class Config:
        from_attributes = True

class CapacitySchema(BaseModel):
    safe_estimated_capacity: int
    capacity_utilization_pct: float
    overcapacity_count: int
    capacity_pressure_score: float
    bottleneck_resource: str

    class Config:
        from_attributes = True

class RiskSchema(BaseModel):
    overall_risk_score: float
    risk_category: str
    contributing_factors: Any


    class Config:
        from_attributes = True

class PrioritySchema(BaseModel):
    priority_score: float
    priority_category: str

    class Config:
        from_attributes = True

class HabitationResponse(HabitationBase):
    id: str
    dataset_id: Optional[str] = None
    created_at: datetime
    hazard: Optional[HazardSchema] = None
    vulnerability: Optional[VulnerabilitySchema] = None
    capacity: Optional[CapacitySchema] = None
    risk: Optional[RiskSchema] = None
    priority: Optional[PrioritySchema] = None

    class Config:
        from_attributes = True
