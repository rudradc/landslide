from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Habitation
from app.services.weather_engine import WeatherEngine

router = APIRouter()

@router.get("/current")
def get_current_weather(district: str = Query("Chamoli", description="District name in Uttarakhand")):
    """
    Get current real-time weather telemetry for a given district.
    """
    return WeatherEngine.get_current_weather(district)

@router.get("/forecast")
def get_weekly_forecast(district: str = Query("Chamoli", description="District name in Uttarakhand")):
    """
    Get 7-day weekly monsoon & hazard forecast for a given district.
    """
    return WeatherEngine.get_weekly_forecast(district)

@router.get("/habitation/{habitation_id}")
def get_habitation_weather(habitation_id: str, db: Session = Depends(get_db)):
    """
    Get localized weather telemetry and 7-day forecast for a specific habitation by ID.
    """
    hab = db.query(Habitation).filter(Habitation.id == habitation_id).first()
    if not hab:
        raise HTTPException(status_code=404, detail="Habitation not found")
    
    forecast_data = WeatherEngine.get_weekly_forecast(hab.district)
    forecast_data["habitation"] = {
        "id": hab.id,
        "name": hab.name,
        "district": hab.district,
        "elevation_m": hab.elevation_m,
        "slope_deg": hab.slope_deg
    }
    return forecast_data

@router.get("/coords")
def get_weather_by_coords(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    name: str = Query(None, description="Optional custom location label")
):
    """
    Get exact spot weather & 7-day forecast for GPS coordinates (detected or chosen location).
    """
    return WeatherEngine.get_weather_by_coordinates(lat, lon, name)

