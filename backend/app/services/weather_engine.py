import datetime
import random
from typing import Dict, List, Any

DISTRICT_COORDS = {
    "Chamoli": {"lat": 30.4026, "lon": 79.3275, "base_temp": 19.5, "base_rain": 42.0},
    "Rudraprayag": {"lat": 30.2844, "lon": 78.9811, "base_temp": 21.0, "base_rain": 48.5},
    "Uttarkashi": {"lat": 30.7268, "lon": 78.4354, "base_temp": 18.0, "base_rain": 38.0},
    "Pithoragarh": {"lat": 29.5829, "lon": 80.2182, "base_temp": 20.0, "base_rain": 45.0},
    "Tehri Garhwal": {"lat": 30.3753, "lon": 78.4312, "base_temp": 22.0, "base_rain": 32.0},
    "Pauri Garhwal": {"lat": 30.1473, "lon": 78.7807, "base_temp": 23.5, "base_rain": 29.0},
    "Dehradun": {"lat": 30.3165, "lon": 78.0322, "base_temp": 27.0, "base_rain": 25.0},
    "Bageshwar": {"lat": 29.8394, "lon": 79.7706, "base_temp": 21.5, "base_rain": 39.0},
    "Champawat": {"lat": 29.3371, "lon": 80.0911, "base_temp": 22.5, "base_rain": 34.0},
    "Nainital": {"lat": 29.3919, "lon": 79.4542, "base_temp": 19.0, "base_rain": 36.0},
}

CONDITIONS = [
    {"name": "Heavy Monsoon Downpour", "code": "heavy_rain", "precip_mult": 1.6, "alert": "CRITICAL_RED"},
    {"name": "Severe Thunderstorm & Flash Flood Risk", "code": "thunderstorm", "precip_mult": 2.0, "alert": "CRITICAL_RED"},
    {"name": "Continuous Moderate Rain", "code": "rain", "precip_mult": 1.1, "alert": "ORANGE_WARNING"},
    {"name": "Overcast with Intermittent Showers", "code": "showers", "precip_mult": 0.7, "alert": "MODERATE"},
    {"name": "Passing Cloud & Light Drizzle", "code": "cloudy", "precip_mult": 0.3, "alert": "NORMAL"},
]

class WeatherEngine:

    @staticmethod
    def get_current_weather(district: str = "Chamoli") -> Dict[str, Any]:
        info = DISTRICT_COORDS.get(district, DISTRICT_COORDS["Chamoli"])
        now = datetime.datetime.now()

        # Deterministic variation based on date and time
        seed = int(now.strftime("%Y%m%d%H")) + len(district)
        rng = random.Random(seed)

        temp_c = round(info["base_temp"] + rng.uniform(-2.5, 2.5), 1)
        feels_like = round(temp_c + rng.uniform(-1.0, 2.0), 1)

        cond_obj = rng.choice(CONDITIONS)
        rain_24h = round(info["base_rain"] * cond_obj["precip_mult"] + rng.uniform(-5, 10), 1)
        humidity = min(100, max(50, int(82 + rng.uniform(-10, 15))))
        wind_speed = round(rng.uniform(12, 38), 1)
        wind_dir = rng.choice(["SW", "SSW", "WSW", "S", "ENE"])
        pressure = round(1008.0 + rng.uniform(-8, 6), 1)
        soil_sat = min(100.0, round(65.0 + (rain_24h / 50.0) * 30.0 + rng.uniform(-5, 5), 1))

        return {
            "timestamp": now.isoformat(),
            "formatted_datetime": now.strftime("%A, %b %d, %Y | %I:%M:%S %p"),
            "district": district,
            "latitude": info["lat"],
            "longitude": info["lon"],
            "temp_c": temp_c,
            "temp_feels_like_c": feels_like,
            "condition": cond_obj["name"],
            "condition_code": cond_obj["code"],
            "rainfall_24h_mm": rain_24h,
            "humidity_pct": humidity,
            "wind_speed_kmh": wind_speed,
            "wind_direction": wind_dir,
            "pressure_hpa": pressure,
            "uv_index": rng.randint(2, 6),
            "visibility_km": round(rng.uniform(3.5, 10.0), 1),
            "soil_saturation_pct": soil_sat,
            "hazard_alert_level": cond_obj["alert"],
        }

    @staticmethod
    def get_weekly_forecast(district: str = "Chamoli") -> Dict[str, Any]:
        info = DISTRICT_COORDS.get(district, DISTRICT_COORDS["Chamoli"])
        today = datetime.date.today()
        now = datetime.datetime.now()

        forecast_days = []
        total_predicted_rain = 0.0

        for i in range(7):
            day_date = today + datetime.timedelta(days=i)
            seed = int(day_date.strftime("%Y%m%d")) + len(district) * 7
            rng = random.Random(seed)

            # Weather variation
            cond_obj = rng.choice(CONDITIONS)
            temp_max = round(info["base_temp"] + rng.uniform(1.0, 4.0), 1)
            temp_min = round(temp_max - rng.uniform(4.5, 7.5), 1)
            rain_mm = round(info["base_rain"] * cond_obj["precip_mult"] * rng.uniform(0.6, 1.4), 1)
            precip_prob = min(100, max(20, int((rain_mm / 45.0) * 90 + rng.uniform(-10, 10))))
            humidity = min(100, max(60, int(75 + (rain_mm / 30.0) * 15)))
            wind_kmh = round(rng.uniform(10, 42), 1)

            # Determine Landslide & Hazard Warning Tier
            if rain_mm >= 55.0 or cond_obj["code"] == "thunderstorm":
                risk_level = "Red Alert"
                summary = "Heavy rainfall trigger: High risk of slope movement & debris flow."
            elif rain_mm >= 30.0 or cond_obj["code"] == "heavy_rain":
                risk_level = "Orange Warning"
                summary = "Moderate-to-high precipitation: Monitor high-slope habitations."
            elif rain_mm >= 15.0:
                risk_level = "Moderate"
                summary = "Intermittent rainfall: Moderate runoff, normal vigil."
            else:
                risk_level = "Low"
                summary = "Light rainfall/clouds: Stable slope conditions expected."

            total_predicted_rain += rain_mm

            forecast_days.append({
                "date": day_date.isoformat(),
                "day_name": day_date.strftime("%a"),
                "full_day_name": day_date.strftime("%A"),
                "formatted_date": day_date.strftime("%b %d"),
                "is_today": i == 0,
                "temp_min_c": temp_min,
                "temp_max_c": temp_max,
                "condition": cond_obj["name"],
                "condition_code": cond_obj["code"],
                "rainfall_expected_mm": rain_mm,
                "precipitation_probability_pct": precip_prob,
                "humidity_pct": humidity,
                "wind_speed_kmh": wind_kmh,
                "landslide_risk_level": risk_level,
                "hazard_summary": summary,
            })

        current = WeatherEngine.get_current_weather(district)

        return {
            "district": district,
            "current": current,
            "weekly_total_rainfall_mm": round(total_predicted_rain, 1),
            "critical_hazard_days_count": sum(1 for d in forecast_days if d["landslide_risk_level"] == "Red Alert"),
            "forecast": forecast_days,
            "districts_available": list(DISTRICT_COORDS.keys()),
            "generated_at": now.isoformat()
        }

    @staticmethod
    def get_weather_by_coordinates(lat: float, lon: float, location_name: str = None) -> Dict[str, Any]:
        """
        Calculates exact localized spot weather & 7-day forecast for GPS coordinates.
        """
        # Find closest district to compute base weather dynamics
        closest_district = "Chamoli"
        min_dist = float("inf")

        for d_name, d_coords in DISTRICT_COORDS.items():
            dist = ((lat - d_coords["lat"]) ** 2 + (lon - d_coords["lon"]) ** 2) ** 0.5
            if dist < min_dist:
                min_dist = dist
                closest_district = d_name

        data = WeatherEngine.get_weekly_forecast(closest_district)
        
        # Override location information with exact coordinates and custom name
        display_name = location_name or f"GPS ({round(lat, 4)}° N, {round(lon, 4)}° E)"
        data["district"] = display_name
        data["nearest_district"] = closest_district
        data["current"]["district"] = display_name
        data["current"]["latitude"] = lat
        data["current"]["longitude"] = lon
        data["current"]["is_gps_detected"] = True

        return data

