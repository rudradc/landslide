from typing import Dict, Any

def calculate_overall_risk(
    hazard_res: dict,
    vulnerability_res: dict,
    capacity_res: dict,
    habitation_data: dict,
    weights: dict = None
) -> dict:
    """
    Computes normalized overall risk score (0-100), risk category classification,
    and explainable factor attributions.
    """
    if weights is None:
        weights = {
            "weight_hazard": 0.30,
            "weight_vulnerability": 0.25,
            "weight_capacity": 0.20,
            "weight_infrastructure": 0.15,
            "weight_history": 0.10,
            "threshold_moderate": 25.0,
            "threshold_high": 50.0,
            "threshold_critical": 75.0
        }

    h_score = hazard_res.get("composite_hazard_score", 0.0)
    v_score = vulnerability_res.get("composite_vulnerability_score", 0.0)
    cp_score = capacity_res.get("capacity_pressure_score", 0.0)

    dist_hosp = float(habitation_data.get("distance_to_hospital_m", 5000.0))
    dist_road = float(habitation_data.get("distance_to_road_m", 500.0))
    ir_score = min(100.0, 0.60 * min(100.0, (dist_hosp / 20000.0) * 100.0) + 0.40 * min(100.0, (dist_road / 5000.0) * 100.0))

    fl_hist = int(habitation_data.get("flood_history_count", 0))
    ls_hist = int(habitation_data.get("landslide_history_count", 0))
    hist_score = min(100.0, fl_hist * 20.0 + ls_hist * 25.0)

    # Weighted Overall Risk Score
    overall_risk = (
        weights["weight_hazard"] * h_score +
        weights["weight_vulnerability"] * v_score +
        weights["weight_capacity"] * cp_score +
        weights["weight_infrastructure"] * ir_score +
        weights["weight_history"] * hist_score
    )
    overall_risk = round(min(100.0, max(0.0, overall_risk)), 2)

    # Risk Category Classification
    if overall_risk >= weights["threshold_critical"]:
        risk_category = "Critical"
    elif overall_risk >= weights["threshold_high"]:
        risk_category = "High"
    elif overall_risk >= weights["threshold_moderate"]:
        risk_category = "Moderate"
    else:
        risk_category = "Low"

    # Explainable XAI Factors Attribution
    total_weighted = (
        weights["weight_hazard"] * h_score +
        weights["weight_vulnerability"] * v_score +
        weights["weight_capacity"] * cp_score +
        weights["weight_infrastructure"] * ir_score +
        weights["weight_history"] * hist_score
    )
    denom = max(0.01, total_weighted)

    factors = [
        {
            "factor": "Hazard Exposure (Landslide/Flood/Rainfall)",
            "impact_pct": round((weights["weight_hazard"] * h_score / denom) * 100.0, 1),
            "raw_score": h_score
        },
        {
            "factor": "Vulnerability (Density & Housing Quality)",
            "impact_pct": round((weights["weight_vulnerability"] * v_score / denom) * 100.0, 1),
            "raw_score": v_score
        },
        {
            "factor": "Capacity Pressure & Overcapacity",
            "impact_pct": round((weights["weight_capacity"] * cp_score / denom) * 100.0, 1),
            "raw_score": cp_score
        },
        {
            "factor": "Infrastructure & Emergency Isolation",
            "impact_pct": round((weights["weight_infrastructure"] * ir_score / denom) * 100.0, 1),
            "raw_score": ir_score
        },
        {
            "factor": "Historical Disaster Frequency",
            "impact_pct": round((weights["weight_history"] * hist_score / denom) * 100.0, 1),
            "raw_score": hist_score
        }
    ]

    # Sort factors by impact descending
    factors.sort(key=lambda x: x["impact_pct"], reverse=True)

    return {
        "overall_risk_score": overall_risk,
        "risk_category": risk_category,
        "contributing_factors": factors
    }
