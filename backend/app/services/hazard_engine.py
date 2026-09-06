import math

def calculate_hazard_scores(habitation_data: dict) -> dict:
    """
    Calculates hazard scores for a habitation based on topographical,
    hydrological, and historical parameters.
    Returns normalized scores (0-100).
    """
    slope = float(habitation_data.get("slope_deg", 15.0))
    rainfall = float(habitation_data.get("annual_rainfall_mm", 1500.0))
    dist_river = float(habitation_data.get("distance_to_river_m", 1000.0))
    elevation = float(habitation_data.get("elevation_m", 1000.0))
    landslide_hist = int(habitation_data.get("landslide_history_count", 0))
    flood_hist = int(habitation_data.get("flood_history_count", 0))

    # 1. Landslide Sub-Score
    # Higher slope, higher rainfall, higher elevation increase landslide risk
    slope_norm = min(100.0, (slope / 45.0) * 100.0)
    rf_ls_norm = min(100.0, (rainfall / 3000.0) * 100.0)
    ls_hist_norm = min(100.0, landslide_hist * 25.0)
    landslide_score = round(min(100.0, 0.45 * slope_norm + 0.35 * rf_ls_norm + 0.20 * ls_hist_norm), 2)

    # 2. Flood Sub-Score
    # Proximity to river (smaller distance = higher risk), high rainfall
    river_proximity_norm = max(0.0, (1.0 - (dist_river / 3000.0))) * 100.0
    flood_hist_norm = min(100.0, flood_hist * 25.0)
    flood_score = round(min(100.0, 0.50 * river_proximity_norm + 0.30 * rf_ls_norm + 0.20 * flood_hist_norm), 2)

    # 3. Rainfall Hazard Sub-Score
    rainfall_score = round(min(100.0, (rainfall / 3500.0) * 100.0), 2)

    # 4. Seismic/Earthquake Hazard Sub-Score (Simulated based on elevation & regional gradient)
    earthquake_score = round(min(100.0, 40.0 + (elevation / 3000.0) * 40.0), 2)

    # 5. Composite Hazard Score
    # Weights: Landslide 35%, Flood 35%, Earthquake 15%, Extreme Rainfall 15%
    composite_hazard = round(
        0.35 * landslide_score +
        0.35 * flood_score +
        0.15 * earthquake_score +
        0.15 * rainfall_score,
        2
    )

    return {
        "landslide_score": landslide_score,
        "flood_score": flood_score,
        "earthquake_score": earthquake_score,
        "rainfall_hazard_score": rainfall_score,
        "composite_hazard_score": composite_hazard
    }
