import pytest
from app.services.hazard_engine import calculate_hazard_scores
from app.services.vulnerability_engine import calculate_vulnerability_scores
from app.services.capacity_engine import calculate_carrying_capacity
from app.services.risk_engine import calculate_overall_risk
from app.services.priority_engine import calculate_relocation_priority

def test_hazard_calculation():
    data = {
        "slope_deg": 35.0,
        "annual_rainfall_mm": 2500.0,
        "distance_to_river_m": 150.0,
        "elevation_m": 1800.0,
        "landslide_history_count": 3,
        "flood_history_count": 1
    }
    res = calculate_hazard_scores(data)
    assert 0.0 <= res["composite_hazard_score"] <= 100.0
    assert res["landslide_score"] > 50.0
    assert res["flood_score"] > 50.0

def test_vulnerability_calculation():
    data = {
        "population": 4000,
        "area_sq_km": 0.5,
        "housing_quality_index": 40.0,
        "distance_to_hospital_m": 15000.0,
        "distance_to_road_m": 2000.0
    }
    res = calculate_vulnerability_scores(data)
    assert 0.0 <= res["composite_vulnerability_score"] <= 100.0
    assert res["social_vulnerability"] == 100.0  # High density

def test_carrying_capacity_calculation():
    data = {
        "population": 5000,
        "safe_land_area_sq_km": 0.5,  # 0.5 * 3500 = 1750 capacity
        "water_capacity_persons": 3000,
        "healthcare_capacity_persons": 2000,
        "road_capacity_persons": 4000
    }
    res = calculate_carrying_capacity(data)
    assert res["safe_estimated_capacity"] == 1750
    assert res["overcapacity_count"] == 3250
    assert res["capacity_pressure_score"] > 50.0
    assert res["bottleneck_resource"] == "Land Availability"

def test_risk_scoring_and_xai():
    data = {
        "population": 5000,
        "slope_deg": 40.0,
        "annual_rainfall_mm": 3000.0,
        "distance_to_river_m": 100.0,
        "distance_to_hospital_m": 18000.0,
        "distance_to_road_m": 3000.0,
        "landslide_history_count": 4,
        "flood_history_count": 2
    }
    h_res = calculate_hazard_scores(data)
    v_res = calculate_vulnerability_scores(data)
    c_res = calculate_carrying_capacity(data)
    r_res = calculate_overall_risk(h_res, v_res, c_res, data)
    
    assert r_res["overall_risk_score"] > 60.0
    assert r_res["risk_category"] in ["High", "Critical"]
    assert len(r_res["contributing_factors"]) == 5

def test_relocation_priority_engine():
    data = {"population": 2000, "distance_to_hospital_m": 10000.0, "distance_to_road_m": 1000.0}
    r_res = {"overall_risk_score": 85.0}
    v_res = {"composite_vulnerability_score": 75.0}
    c_res = {"capacity_pressure_score": 80.0}
    
    p_res = calculate_relocation_priority(r_res, v_res, c_res, data)
    assert p_res["priority_score"] >= 75.0
    assert p_res["priority_category"] == "Immediate Relocation Assessment Recommended"
