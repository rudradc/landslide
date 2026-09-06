import os
import csv
import random

DISTRICTS = ["Chamoli", "Rudraprayag", "Uttarkashi", "Pithoragarh", "Tehri Garhwal"]
VILLAGE_PREFIXES = [
    "Raini", "Joshimath", "Gauchar", "Pipalkoti", "Karnaprayag", "Guptkashi", "Kedarnath",
    "Badrinath", "Ukhimath", "Bhararisain", "Tharali", "Ghat", "Pokhari", "Nandaprayag",
    "Devprayag", "Chinyalisaur", "Barkot", "Purola", "Dharasu", "Bhatwari", "Dharchula",
    "Munsyari", "Berinag", "Gangolihat", "Didihat", "Pauri", "Srinagar", "Lansdowne", "Rishikesh"
]
VILLAGE_SUFFIXES = ["Upper", "Lower", "Basti", "Sector 1", "Sector 2", "Valley", "Ridge", "Ghar", "Khet", "Gaon"]

SOIL_TYPES = ["Clay-Loam", "Silt-Clay", "Rocky Slates", "Moraine Soil", "Alluvial Deposits"]
ASPECTS = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"]

def generate_100_habitations_csv(filepath: str):
    random.seed(42)
    rows = []

    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)

    headers = [
        "habitation_code", "name", "district", "state", "latitude", "longitude",
        "population", "households", "area_sq_km", "elevation_m", "slope_deg", "aspect",
        "soil_type", "land_use", "annual_rainfall_mm", "distance_to_river_m",
        "distance_to_road_m", "distance_to_hospital_m", "water_availability_index",
        "housing_quality_index", "safe_land_area_sq_km", "water_capacity_persons",
        "healthcare_capacity_persons", "road_capacity_persons", "flood_history_count",
        "landslide_history_count"
    ]

    for i in range(1, 101):
        code = f"HAB{i:03d}"
        prefix = random.choice(VILLAGE_PREFIXES)
        suffix = random.choice(VILLAGE_SUFFIXES)
        name = f"{prefix} {suffix}"
        district = random.choice(DISTRICTS)
        
        lat = round(30.0 + random.uniform(0.0, 1.2), 4)
        lon = round(78.5 + random.uniform(0.0, 2.0), 4)

        pop = random.randint(150, 4800)
        hh = int(pop / random.uniform(4.5, 5.8))
        area = round(random.uniform(0.5, 4.5), 2)
        elev = round(random.uniform(750.0, 2800.0), 1)
        slope = round(random.uniform(5.0, 44.0), 1)
        aspect = random.choice(ASPECTS)
        soil = random.choice(SOIL_TYPES)
        land_use = random.choice(["Residential", "Agricultural-Residential", "Forest Fringe Settlement"])

        rainfall = round(random.uniform(1100.0, 3400.0), 1)
        dist_river = round(random.uniform(50.0, 3500.0), 1)
        dist_road = round(random.uniform(50.0, 6500.0), 1)
        dist_hosp = round(random.uniform(1200.0, 24000.0), 1)

        water_idx = round(random.uniform(40.0, 95.0), 1)
        housing_idx = round(random.uniform(30.0, 90.0), 1)
        safe_land = round(area * random.uniform(0.15, 0.65), 2)

        water_cap = int(pop * random.uniform(0.6, 1.4))
        health_cap = int(pop * random.uniform(0.5, 1.2))
        road_cap = int(pop * random.uniform(0.7, 1.5))

        flood_hist = random.choice([0, 0, 0, 1, 1, 2, 3])
        landslide_hist = random.choice([0, 0, 1, 1, 2, 3, 4]) if slope > 22.0 else random.choice([0, 0, 1])

        row = {
            "habitation_code": code,
            "name": name,
            "district": district,
            "state": "Uttarakhand",
            "latitude": lat,
            "longitude": lon,
            "population": pop,
            "households": hh,
            "area_sq_km": area,
            "elevation_m": elev,
            "slope_deg": slope,
            "aspect": aspect,
            "soil_type": soil,
            "land_use": land_use,
            "annual_rainfall_mm": rainfall,
            "distance_to_river_m": dist_river,
            "distance_to_road_m": dist_road,
            "distance_to_hospital_m": dist_hosp,
            "water_availability_index": water_idx,
            "housing_quality_index": housing_idx,
            "safe_land_area_sq_km": safe_land,
            "water_capacity_persons": water_cap,
            "healthcare_capacity_persons": health_cap,
            "road_capacity_persons": road_cap,
            "flood_history_count": flood_hist,
            "landslide_history_count": landslide_hist
        }
        rows.append(row)

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)

if __name__ == "__main__":
    generate_100_habitations_csv("../data/sample_habitations_100.csv")
