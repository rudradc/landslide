from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.models.entities import User, Role, RelocationSite, RiskConfig, Habitation, HazardAssessment, VulnerabilityAssessment, CapacityAssessment, RiskAssessment, RelocationPriority
from app.core.security import get_password_hash
from app.api.routes import auth, habitations, upload, analysis, relocation, ml, reports, config, weather
from app.services.hazard_engine import calculate_hazard_scores
from app.services.vulnerability_engine import calculate_vulnerability_scores
from app.services.capacity_engine import calculate_carrying_capacity
from app.services.risk_engine import calculate_overall_risk
from app.services.priority_engine import calculate_relocation_priority

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create database tables
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    try:
        # Seed Roles
        roles_data = [
            ("ADMIN", "System administrator with full access"),
            ("AUTHORITY", "Disaster management authority official"),
            ("ANALYST", "Data analyst and ML engineer"),
            ("VIEWER", "Read-only viewer")
        ]
        for role_name, desc in roles_data:
            if not db.query(Role).filter(Role.name == role_name).first():
                db.add(Role(name=role_name, description=desc))
        db.commit()

        # Seed Default Users
        users_seed = [
            ("admin@disaster.gov.in", "Admin User", "ADMIN", "admin123"),
            ("authority@disaster.gov.in", "Disaster Officer", "AUTHORITY", "authority123"),
            ("analyst@disaster.gov.in", "Risk Analyst", "ANALYST", "analyst123"),
            ("viewer@disaster.gov.in", "Public Viewer", "VIEWER", "viewer123")
        ]
        for email, name, role_name, pwd in users_seed:
            if not db.query(User).filter(User.email == email).first():
                db.add(User(
                    email=email,
                    full_name=name,
                    role_name=role_name,
                    hashed_password=get_password_hash(pwd)
                ))
        db.commit()

        # Seed Risk Configuration
        if not db.query(RiskConfig).first():
            db.add(RiskConfig())
            db.commit()

        # Seed Candidate Relocation Sites
        if db.query(RelocationSite).count() == 0:
            sites = [
                RelocationSite(
                    site_code="SITE_ALPHA_01",
                    name="Gauchar Plateau Safe Zone",
                    district="Chamoli",
                    latitude=30.2854,
                    longitude=79.1542,
                    available_land_sq_km=8.5,
                    target_population_capacity=12000,
                    water_availability_index=90.0,
                    road_connectivity_index=88.0,
                    distance_from_hazard_zone_m=15000.0,
                    environmental_suitability_index=92.0
                ),
                RelocationSite(
                    site_code="SITE_BETA_02",
                    name="Karnaprayag High Terrace",
                    district="Chamoli",
                    latitude=30.2600,
                    longitude=79.2185,
                    available_land_sq_km=6.2,
                    target_population_capacity=8500,
                    water_availability_index=85.0,
                    road_connectivity_index=82.0,
                    distance_from_hazard_zone_m=12000.0,
                    environmental_suitability_index=87.0
                ),
                RelocationSite(
                    site_code="SITE_GAMMA_03",
                    name="Pipalkoti Safe Valley",
                    district="Chamoli",
                    latitude=30.4312,
                    longitude=79.4310,
                    available_land_sq_km=4.8,
                    target_population_capacity=6000,
                    water_availability_index=80.0,
                    road_connectivity_index=78.0,
                    distance_from_hazard_zone_m=9500.0,
                    environmental_suitability_index=81.0
                )
            ]
            db.add_all(sites)
            db.commit()

        # Seed Initial Demo Habitations if empty
        if db.query(Habitation).count() == 0:
            demo_habs = [
                {
                    "habitation_code": "HAB001",
                    "name": "Raini Village Upper",
                    "district": "Chamoli",
                    "state": "Uttarakhand",
                    "latitude": 30.4851,
                    "longitude": 79.6912,
                    "population": 2450,
                    "households": 420,
                    "area_sq_km": 1.2,
                    "elevation_m": 1950.0,
                    "slope_deg": 38.5,
                    "aspect": "North-West",
                    "soil_type": "Rocky Slates",
                    "land_use": "Forest Fringe Settlement",
                    "annual_rainfall_mm": 2650.0,
                    "distance_to_river_m": 120.0,
                    "distance_to_road_m": 2400.0,
                    "distance_to_hospital_m": 18500.0,
                    "safe_land_area_sq_km": 0.25,
                    "water_capacity_persons": 1200,
                    "healthcare_capacity_persons": 800,
                    "road_capacity_persons": 1000,
                    "landslide_history_count": 3,
                    "flood_history_count": 2,
                    "housing_quality_index": 35.0,
                    "water_availability_index": 45.0
                },
                {
                    "habitation_code": "HAB002",
                    "name": "Joshimath Sector 4",
                    "district": "Chamoli",
                    "state": "Uttarakhand",
                    "latitude": 30.5556,
                    "longitude": 79.5667,
                    "population": 5200,
                    "households": 980,
                    "area_sq_km": 2.1,
                    "elevation_m": 1890.0,
                    "slope_deg": 32.0,
                    "aspect": "North",
                    "soil_type": "Moraine Soil",
                    "land_use": "Residential",
                    "annual_rainfall_mm": 2100.0,
                    "distance_to_river_m": 450.0,
                    "distance_to_road_m": 200.0,
                    "distance_to_hospital_m": 3500.0,
                    "safe_land_area_sq_km": 0.80,
                    "water_capacity_persons": 3200,
                    "healthcare_capacity_persons": 2500,
                    "road_capacity_persons": 4000,
                    "landslide_history_count": 4,
                    "flood_history_count": 1,
                    "housing_quality_index": 50.0,
                    "water_availability_index": 60.0
                },
                {
                    "habitation_code": "HAB003",
                    "name": "Helang Valley Basti",
                    "district": "Chamoli",
                    "state": "Uttarakhand",
                    "latitude": 30.5120,
                    "longitude": 79.5230,
                    "population": 1950,
                    "households": 340,
                    "area_sq_km": 1.1,
                    "elevation_m": 1520.0,
                    "slope_deg": 36.0,
                    "aspect": "West",
                    "soil_type": "Silt-Clay",
                    "land_use": "Agricultural-Residential",
                    "annual_rainfall_mm": 2400.0,
                    "distance_to_river_m": 210.0,
                    "distance_to_road_m": 1200.0,
                    "distance_to_hospital_m": 14000.0,
                    "safe_land_area_sq_km": 0.30,
                    "water_capacity_persons": 1100,
                    "healthcare_capacity_persons": 900,
                    "road_capacity_persons": 1200,
                    "landslide_history_count": 2,
                    "flood_history_count": 1,
                    "housing_quality_index": 42.0,
                    "water_availability_index": 55.0
                },
                {
                    "habitation_code": "HAB004",
                    "name": "Pandukeshwar Ridge",
                    "district": "Chamoli",
                    "state": "Uttarakhand",
                    "latitude": 30.6310,
                    "longitude": 79.5480,
                    "population": 3100,
                    "households": 560,
                    "area_sq_km": 1.8,
                    "elevation_m": 1820.0,
                    "slope_deg": 29.5,
                    "aspect": "South-West",
                    "soil_type": "Rocky Slates",
                    "land_use": "Residential",
                    "annual_rainfall_mm": 2300.0,
                    "distance_to_river_m": 310.0,
                    "distance_to_road_m": 600.0,
                    "distance_to_hospital_m": 8500.0,
                    "safe_land_area_sq_km": 0.65,
                    "water_capacity_persons": 2100,
                    "healthcare_capacity_persons": 1800,
                    "road_capacity_persons": 2200,
                    "landslide_history_count": 2,
                    "flood_history_count": 2,
                    "housing_quality_index": 55.0,
                    "water_availability_index": 68.0
                },
                {
                    "habitation_code": "HAB005",
                    "name": "Kedarnath Base Basti",
                    "district": "Rudraprayag",
                    "state": "Uttarakhand",
                    "latitude": 30.7350,
                    "longitude": 79.0667,
                    "population": 1650,
                    "households": 280,
                    "area_sq_km": 0.9,
                    "elevation_m": 2450.0,
                    "slope_deg": 41.0,
                    "aspect": "North-East",
                    "soil_type": "Moraine Soil",
                    "land_use": "Forest Fringe Settlement",
                    "annual_rainfall_mm": 3100.0,
                    "distance_to_river_m": 80.0,
                    "distance_to_road_m": 4500.0,
                    "distance_to_hospital_m": 22000.0,
                    "safe_land_area_sq_km": 0.18,
                    "water_capacity_persons": 750,
                    "healthcare_capacity_persons": 500,
                    "road_capacity_persons": 800,
                    "landslide_history_count": 4,
                    "flood_history_count": 3,
                    "housing_quality_index": 30.0,
                    "water_availability_index": 40.0
                },
                {
                    "habitation_code": "HAB006",
                    "name": "Guptkashi Sector 1",
                    "district": "Rudraprayag",
                    "state": "Uttarakhand",
                    "latitude": 30.5230,
                    "longitude": 79.0780,
                    "population": 3800,
                    "households": 720,
                    "area_sq_km": 2.5,
                    "elevation_m": 1319.0,
                    "slope_deg": 21.0,
                    "aspect": "East",
                    "soil_type": "Clay-Loam",
                    "land_use": "Residential",
                    "annual_rainfall_mm": 1850.0,
                    "distance_to_river_m": 1200.0,
                    "distance_to_road_m": 150.0,
                    "distance_to_hospital_m": 2100.0,
                    "safe_land_area_sq_km": 1.4,
                    "water_capacity_persons": 3900,
                    "healthcare_capacity_persons": 3500,
                    "road_capacity_persons": 4200,
                    "landslide_history_count": 1,
                    "flood_history_count": 0,
                    "housing_quality_index": 72.0,
                    "water_availability_index": 78.0
                },
                {
                    "habitation_code": "HAB007",
                    "name": "Sonprayag Riverside",
                    "district": "Rudraprayag",
                    "state": "Uttarakhand",
                    "latitude": 30.6300,
                    "longitude": 78.9950,
                    "population": 2100,
                    "households": 390,
                    "area_sq_km": 0.85,
                    "elevation_m": 1820.0,
                    "slope_deg": 35.5,
                    "aspect": "South",
                    "soil_type": "Alluvial Deposits",
                    "land_use": "Forest Fringe Settlement",
                    "annual_rainfall_mm": 2850.0,
                    "distance_to_river_m": 90.0,
                    "distance_to_road_m": 800.0,
                    "distance_to_hospital_m": 16500.0,
                    "safe_land_area_sq_km": 0.22,
                    "water_capacity_persons": 1050,
                    "healthcare_capacity_persons": 800,
                    "road_capacity_persons": 1100,
                    "landslide_history_count": 3,
                    "flood_history_count": 3,
                    "housing_quality_index": 38.0,
                    "water_availability_index": 48.0
                },
                {
                    "habitation_code": "HAB008",
                    "name": "Pipalkoti Central",
                    "district": "Chamoli",
                    "state": "Uttarakhand",
                    "latitude": 30.4312,
                    "longitude": 79.4310,
                    "population": 2900,
                    "households": 510,
                    "area_sq_km": 2.2,
                    "elevation_m": 1260.0,
                    "slope_deg": 18.0,
                    "aspect": "South-East",
                    "soil_type": "Clay-Loam",
                    "land_use": "Residential",
                    "annual_rainfall_mm": 1650.0,
                    "distance_to_river_m": 950.0,
                    "distance_to_road_m": 100.0,
                    "distance_to_hospital_m": 1200.0,
                    "safe_land_area_sq_km": 1.6,
                    "water_capacity_persons": 3400,
                    "healthcare_capacity_persons": 3000,
                    "road_capacity_persons": 3500,
                    "landslide_history_count": 0,
                    "flood_history_count": 0,
                    "housing_quality_index": 78.0,
                    "water_availability_index": 82.0
                },
                {
                    "habitation_code": "HAB009",
                    "name": "Gauchar Lower Basti",
                    "district": "Chamoli",
                    "state": "Uttarakhand",
                    "latitude": 30.2820,
                    "longitude": 79.1580,
                    "population": 1800,
                    "households": 310,
                    "area_sq_km": 3.5,
                    "elevation_m": 820.0,
                    "slope_deg": 8.5,
                    "aspect": "East",
                    "soil_type": "Alluvial Deposits",
                    "land_use": "Agricultural-Residential",
                    "annual_rainfall_mm": 1350.0,
                    "distance_to_river_m": 1800.0,
                    "distance_to_road_m": 100.0,
                    "distance_to_hospital_m": 1500.0,
                    "safe_land_area_sq_km": 2.2,
                    "water_capacity_persons": 4500,
                    "healthcare_capacity_persons": 3000,
                    "road_capacity_persons": 4000,
                    "landslide_history_count": 0,
                    "flood_history_count": 0,
                    "housing_quality_index": 82.0,
                    "water_availability_index": 88.0
                },
                {
                    "habitation_code": "HAB010",
                    "name": "Ukhimath High Slope",
                    "district": "Rudraprayag",
                    "state": "Uttarakhand",
                    "latitude": 30.5180,
                    "longitude": 79.0950,
                    "population": 2750,
                    "households": 490,
                    "area_sq_km": 1.6,
                    "elevation_m": 1310.0,
                    "slope_deg": 28.0,
                    "aspect": "North-West",
                    "soil_type": "Silt-Clay",
                    "land_use": "Residential",
                    "annual_rainfall_mm": 2100.0,
                    "distance_to_river_m": 600.0,
                    "distance_to_road_m": 450.0,
                    "distance_to_hospital_m": 4200.0,
                    "safe_land_area_sq_km": 0.9,
                    "water_capacity_persons": 2400,
                    "healthcare_capacity_persons": 2200,
                    "road_capacity_persons": 2600,
                    "landslide_history_count": 2,
                    "flood_history_count": 1,
                    "housing_quality_index": 60.0,
                    "water_availability_index": 70.0
                }
            ]
            for h in demo_habs:
                hab = Habitation(**h)
                db.add(hab)
                db.commit()
                db.refresh(hab)

                h_res = calculate_hazard_scores(h)
                v_res = calculate_vulnerability_scores(h)
                c_res = calculate_carrying_capacity(h)
                r_res = calculate_overall_risk(h_res, v_res, c_res, h)
                p_res = calculate_relocation_priority(r_res, v_res, c_res, h)

                db.add(HazardAssessment(habitation_id=hab.id, **h_res))
                db.add(VulnerabilityAssessment(habitation_id=hab.id, **v_res))
                db.add(CapacityAssessment(habitation_id=hab.id, **c_res))
                db.add(RiskAssessment(habitation_id=hab.id, **r_res))
                db.add(RelocationPriority(habitation_id=hab.id, **p_res))
            db.commit()
    finally:
        db.close()

seed_database()

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(habitations.router, prefix=f"{settings.API_V1_STR}/habitations", tags=["Habitations"])
app.include_router(upload.router, prefix=f"{settings.API_V1_STR}/data", tags=["Data Upload"])
app.include_router(analysis.router, prefix=f"{settings.API_V1_STR}/analysis", tags=["Risk Analysis"])
app.include_router(relocation.router, prefix=f"{settings.API_V1_STR}/relocation", tags=["Relocation Sites"])
app.include_router(ml.router, prefix=f"{settings.API_V1_STR}/ml", tags=["Machine Learning"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports"])
app.include_router(config.router, prefix=f"{settings.API_V1_STR}/config", tags=["System Config"])
app.include_router(weather.router, prefix=f"{settings.API_V1_STR}/weather", tags=["Weather"])

# Mount static directory for self-contained Web Application UI
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    @app.get("/")
    def root():
        return {
            "message": "Disaster Risk Assessment and Relocation Decision Support System API",
            "version": "1.0.0",
            "docs": "/docs"
        }

