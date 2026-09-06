import uuid
import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # ADMIN, AUTHORITY, ANALYST, VIEWER
    description = Column(Text, nullable=True)

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role_name = Column(String(50), default="VIEWER")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    version = Column(String(20), default="1.0.0")
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    total_rows = Column(Integer, default=0)
    valid_rows = Column(Integer, default=0)
    invalid_rows = Column(Integer, default=0)
    file_path = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    habitations = relationship("Habitation", back_populates="dataset", cascade="all, delete-orphan")

class Habitation(Base):
    __tablename__ = "habitations"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=True)
    habitation_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    district = Column(String(100), index=True, nullable=False)
    state = Column(String(100), nullable=False, default="Uttarakhand")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    population = Column(Integer, nullable=False, default=0)
    households = Column(Integer, nullable=False, default=0)
    area_sq_km = Column(Float, nullable=False, default=1.0)
    elevation_m = Column(Float, default=1000.0)
    slope_deg = Column(Float, default=15.0)
    aspect = Column(String(20), default="North")
    soil_type = Column(String(50), default="Clay-Loam")
    land_use = Column(String(50), default="Residential")
    annual_rainfall_mm = Column(Float, default=1500.0)
    distance_to_river_m = Column(Float, default=1000.0)
    distance_to_road_m = Column(Float, default=500.0)
    distance_to_hospital_m = Column(Float, default=5000.0)
    water_availability_index = Column(Float, default=70.0)
    housing_quality_index = Column(Float, default=60.0)
    safe_land_area_sq_km = Column(Float, default=0.5)
    water_capacity_persons = Column(Integer, default=2000)
    healthcare_capacity_persons = Column(Integer, default=1500)
    road_capacity_persons = Column(Integer, default=3000)
    flood_history_count = Column(Integer, default=0)
    landslide_history_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    dataset = relationship("Dataset", back_populates="habitations")
    hazard = relationship("HazardAssessment", uselist=False, back_populates="habitation", cascade="all, delete-orphan")
    vulnerability = relationship("VulnerabilityAssessment", uselist=False, back_populates="habitation", cascade="all, delete-orphan")
    capacity = relationship("CapacityAssessment", uselist=False, back_populates="habitation", cascade="all, delete-orphan")
    risk = relationship("RiskAssessment", uselist=False, back_populates="habitation", cascade="all, delete-orphan")
    priority = relationship("RelocationPriority", uselist=False, back_populates="habitation", cascade="all, delete-orphan")
    recommendations = relationship("RelocationRecommendation", back_populates="habitation", cascade="all, delete-orphan")

class HazardAssessment(Base):
    __tablename__ = "hazard_assessments"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    habitation_id = Column(String(36), ForeignKey("habitations.id"), nullable=False)
    landslide_score = Column(Float, default=0.0)
    flood_score = Column(Float, default=0.0)
    earthquake_score = Column(Float, default=0.0)
    rainfall_hazard_score = Column(Float, default=0.0)
    composite_hazard_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    habitation = relationship("Habitation", back_populates="hazard")

class VulnerabilityAssessment(Base):
    __tablename__ = "vulnerability_assessments"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    habitation_id = Column(String(36), ForeignKey("habitations.id"), nullable=False)
    social_vulnerability = Column(Float, default=0.0)
    structural_vulnerability = Column(Float, default=0.0)
    accessibility_vulnerability = Column(Float, default=0.0)
    composite_vulnerability_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    habitation = relationship("Habitation", back_populates="vulnerability")

class CapacityAssessment(Base):
    __tablename__ = "capacity_assessments"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    habitation_id = Column(String(36), ForeignKey("habitations.id"), nullable=False)
    safe_estimated_capacity = Column(Integer, default=0)
    capacity_utilization_pct = Column(Float, default=0.0)
    overcapacity_count = Column(Integer, default=0)
    capacity_pressure_score = Column(Float, default=0.0)
    bottleneck_resource = Column(String(50), default="Land Availability")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    habitation = relationship("Habitation", back_populates="capacity")

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    habitation_id = Column(String(36), ForeignKey("habitations.id"), nullable=False)
    overall_risk_score = Column(Float, default=0.0)
    risk_category = Column(String(20), default="Low")  # Low, Moderate, High, Critical
    contributing_factors = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    habitation = relationship("Habitation", back_populates="risk")

class RelocationPriority(Base):
    __tablename__ = "relocation_priorities"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    habitation_id = Column(String(36), ForeignKey("habitations.id"), nullable=False)
    priority_score = Column(Float, default=0.0)
    priority_category = Column(String(50), default="Low Priority")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    habitation = relationship("Habitation", back_populates="priority")

class RelocationSite(Base):
    __tablename__ = "relocation_sites"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    site_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    district = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    available_land_sq_km = Column(Float, default=5.0)
    target_population_capacity = Column(Integer, default=5000)
    water_availability_index = Column(Float, default=85.0)
    road_connectivity_index = Column(Float, default=80.0)
    distance_from_hazard_zone_m = Column(Float, default=10000.0)
    environmental_suitability_index = Column(Float, default=85.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    recommendations = relationship("RelocationRecommendation", back_populates="relocation_site")

class RelocationRecommendation(Base):
    __tablename__ = "relocation_recommendations"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    habitation_id = Column(String(36), ForeignKey("habitations.id"), nullable=False)
    relocation_site_id = Column(String(36), ForeignKey("relocation_sites.id"), nullable=False)
    suitability_score = Column(Float, default=0.0)
    rank_order = Column(Integer, default=1)
    suitability_tier = Column(String(50), default="Recommended Candidate")
    rationale = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    habitation = relationship("Habitation", back_populates="recommendations")
    relocation_site = relationship("RelocationSite", back_populates="recommendations")

class RiskConfig(Base):
    __tablename__ = "risk_configs"
    id = Column(Integer, primary_key=True, default=1)
    weight_hazard = Column(Float, default=0.30)
    weight_vulnerability = Column(Float, default=0.25)
    weight_capacity = Column(Float, default=0.20)
    weight_infrastructure = Column(Float, default=0.15)
    weight_history = Column(Float, default=0.10)
    threshold_moderate = Column(Float, default=25.0)
    threshold_high = Column(Float, default=50.0)
    threshold_critical = Column(Float, default=75.0)
