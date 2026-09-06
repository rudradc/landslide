def calculate_relocation_priority(
    risk_res: dict,
    vulnerability_res: dict,
    capacity_res: dict,
    habitation_data: dict
) -> dict:
    """
    Calculates Relocation Priority Score (RPS) and decision-support priority category.
    Formula: 40% Risk + 25% Vulnerability + 20% Capacity Pressure + 10% Infrastructure Risk + 5% History.
    """
    overall_risk = risk_res.get("overall_risk_score", 0.0)
    v_score = vulnerability_res.get("composite_vulnerability_score", 0.0)
    cp_score = capacity_res.get("capacity_pressure_score", 0.0)

    dist_hosp = float(habitation_data.get("distance_to_hospital_m", 5000.0))
    dist_road = float(habitation_data.get("distance_to_road_m", 500.0))
    ir_score = min(100.0, 0.60 * min(100.0, (dist_hosp / 20000.0) * 100.0) + 0.40 * min(100.0, (dist_road / 5000.0) * 100.0))

    fl_hist = int(habitation_data.get("flood_history_count", 0))
    ls_hist = int(habitation_data.get("landslide_history_count", 0))
    hist_score = min(100.0, fl_hist * 20.0 + ls_hist * 25.0)

    priority_score = round(
        0.40 * overall_risk +
        0.25 * v_score +
        0.20 * cp_score +
        0.10 * ir_score +
        0.05 * hist_score,
        2
    )
    priority_score = min(100.0, max(0.0, priority_score))

    # Explicit decision support categories
    if priority_score >= 75.0:
        category = "Immediate Relocation Assessment Recommended"
    elif priority_score >= 50.0:
        category = "High Priority for Authority Review"
    elif priority_score >= 25.0:
        category = "Moderate Priority - Monitor & Plan"
    else:
        category = "Low Relocation Priority"

    return {
        "priority_score": priority_score,
        "priority_category": category
    }
