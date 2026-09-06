import math

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes distance in kilometers between two lat/lon coordinates using Haversine formula.
    """
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def rank_relocation_sites(habitation: dict, candidate_sites: list) -> list:
    """
    Ranks potential relocation sites based on:
    - Safe distance from origin hazard zone
    - Available land area
    - Water & road connectivity indices
    - Target population capacity
    Returns ranked list of candidate recommendations.
    """
    hab_lat = float(habitation.get("latitude", 0.0))
    hab_lon = float(habitation.get("longitude", 0.0))
    hab_pop = int(habitation.get("population", 100))

    ranked_results = []
    for site in candidate_sites:
        site_lat = float(site.get("latitude", 0.0))
        site_lon = float(site.get("longitude", 0.0))
        dist_km = haversine_distance(hab_lat, hab_lon, site_lat, site_lon)

        # Proximity score (Optimal relocation distance is 5 km to 30 km)
        if dist_km < 2.0:
            dist_score = 30.0  # Too close to origin risk zone
        elif dist_km <= 30.0:
            dist_score = 100.0 - (dist_km / 30.0) * 30.0
        else:
            dist_score = max(10.0, 70.0 - ((dist_km - 30.0) / 70.0) * 60.0)

        # Capacity suitability
        target_cap = int(site.get("target_population_capacity", 5000))
        cap_score = 100.0 if target_cap >= hab_pop else (target_cap / max(1, hab_pop)) * 100.0

        water_idx = float(site.get("water_availability_index", 80.0))
        road_idx = float(site.get("road_connectivity_index", 80.0))
        env_idx = float(site.get("environmental_suitability_index", 85.0))

        suitability = round(
            0.25 * dist_score +
            0.25 * cap_score +
            0.20 * water_idx +
            0.15 * road_idx +
            0.15 * env_idx,
            2
        )
        suitability = min(100.0, max(0.0, suitability))

        if suitability >= 80.0:
            tier = "Recommended Candidate"
        elif suitability >= 60.0:
            tier = "Alternative Candidate"
        else:
            tier = "Low Suitability Candidate"

        rationale = {
            "distance_km": round(dist_km, 2),
            "proximity_score": round(dist_score, 1),
            "capacity_fit": f"{target_cap} capacity vs {hab_pop} population required",
            "water_availability": water_idx,
            "road_connectivity": road_idx,
            "environmental_suitability": env_idx
        }

        ranked_results.append({
            "site": site,
            "suitability_score": suitability,
            "suitability_tier": tier,
            "rationale": rationale
        })

    # Sort descending by suitability score
    ranked_results.sort(key=lambda x: x["suitability_score"], reverse=True)

    # Assign rank order
    for idx, item in enumerate(ranked_results, 1):
        item["rank_order"] = idx

    return ranked_results
