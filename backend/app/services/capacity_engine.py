def calculate_carrying_capacity(habitation_data: dict) -> dict:
    """
    Estimates safe carrying capacity (C_safe) and capacity pressure score (CP).
    Determines primary resource bottleneck.
    """
    population = int(habitation_data.get("population", 100))
    safe_land_sq_km = float(habitation_data.get("safe_land_area_sq_km", 0.5))
    water_capacity = int(habitation_data.get("water_capacity_persons", 2000))
    health_capacity = int(habitation_data.get("healthcare_capacity_persons", 1500))
    road_capacity = int(habitation_data.get("road_capacity_persons", 3000))

    # Safe land density benchmark: 3500 persons per sq km of safe un-sloped land
    land_capacity = int(safe_land_sq_km * 3500)

    capacity_dict = {
        "Land Availability": max(10, land_capacity),
        "Water Availability": max(10, water_capacity),
        "Healthcare Capacity": max(10, health_capacity),
        "Road & Transit Infrastructure": max(10, road_capacity)
    }

    # Bottleneck is minimum carrying capacity among constraints
    bottleneck_resource = min(capacity_dict, key=capacity_dict.get)
    safe_estimated_capacity = capacity_dict[bottleneck_resource]

    overcapacity_count = max(0, population - safe_estimated_capacity)
    capacity_utilization_pct = round((population / max(1, safe_estimated_capacity)) * 100.0, 2)

    # Capacity Pressure Score (0-100)
    if population <= safe_estimated_capacity:
        capacity_pressure = round(min(50.0, (capacity_utilization_pct / 100.0) * 50.0), 2)
    else:
        overcapacity_ratio = (population - safe_estimated_capacity) / float(safe_estimated_capacity)
        capacity_pressure = round(min(100.0, 50.0 + overcapacity_ratio * 50.0), 2)

    return {
        "safe_estimated_capacity": safe_estimated_capacity,
        "capacity_utilization_pct": capacity_utilization_pct,
        "overcapacity_count": overcapacity_count,
        "capacity_pressure_score": capacity_pressure,
        "bottleneck_resource": bottleneck_resource
    }
