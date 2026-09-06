import io
import pandas as pd
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Dataset, Habitation, HazardAssessment, VulnerabilityAssessment, CapacityAssessment, RiskAssessment, RelocationPriority
from app.services.validation_engine import validate_habitation_csv
from app.services.hazard_engine import calculate_hazard_scores
from app.services.vulnerability_engine import calculate_vulnerability_scores
from app.services.capacity_engine import calculate_carrying_capacity
from app.services.risk_engine import calculate_overall_risk
from app.services.priority_engine import calculate_relocation_priority
from app.api.deps import RoleChecker

router = APIRouter()

@router.post("/upload")
async def upload_csv_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN", "ANALYST"]))
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    valid_rows, invalid_rows, summary = validate_habitation_csv(df)

    dataset = Dataset(
        name=file.filename,
        total_rows=summary["total_rows"],
        valid_rows=summary["valid_rows"],
        invalid_rows=summary["invalid_rows"],
        file_path=file.filename
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    # Batch insert valid habitations and compute scoring
    for row in valid_rows:
        code = str(row["habitation_code"]).strip()
        existing = db.query(Habitation).filter(Habitation.habitation_code == code).first()
        if existing:
            continue

        hab = Habitation(
            dataset_id=dataset.id,
            habitation_code=code,
            name=str(row["name"]).strip(),
            district=str(row.get("district", "Chamoli")).strip(),
            state=str(row.get("state", "Uttarakhand")).strip(),
            latitude=float(row["latitude"]),
            longitude=float(row["longitude"]),
            population=int(row["population"]),
            households=int(row["households"]),
            area_sq_km=float(row.get("area_sq_km", 1.0)),
            elevation_m=float(row.get("elevation_m", 1000.0)),
            slope_deg=float(row.get("slope_deg", 15.0)),
            aspect=str(row.get("aspect", "North")),
            soil_type=str(row.get("soil_type", "Clay-Loam")),
            land_use=str(row.get("land_use", "Residential")),
            annual_rainfall_mm=float(row.get("annual_rainfall_mm", 1500.0)),
            distance_to_river_m=float(row.get("distance_to_river_m", 1000.0)),
            distance_to_road_m=float(row.get("distance_to_road_m", 500.0)),
            distance_to_hospital_m=float(row.get("distance_to_hospital_m", 5000.0)),
            water_availability_index=float(row.get("water_availability_index", 70.0)),
            housing_quality_index=float(row.get("housing_quality_index", 60.0)),
            safe_land_area_sq_km=float(row.get("safe_land_area_sq_km", 0.5)),
            water_capacity_persons=int(row.get("water_capacity_persons", 2000)),
            healthcare_capacity_persons=int(row.get("healthcare_capacity_persons", 1500)),
            road_capacity_persons=int(row.get("road_capacity_persons", 3000)),
            flood_history_count=int(row.get("flood_history_count", 0)),
            landslide_history_count=int(row.get("landslide_history_count", 0))
        )
        db.add(hab)
        db.commit()
        db.refresh(hab)

        # Compute initial analytical scores
        h_res = calculate_hazard_scores(row)
        v_res = calculate_vulnerability_scores(row)
        c_res = calculate_carrying_capacity(row)
        r_res = calculate_overall_risk(h_res, v_res, c_res, row)
        p_res = calculate_relocation_priority(r_res, v_res, c_res, row)

        db.add(HazardAssessment(habitation_id=hab.id, **h_res))
        db.add(VulnerabilityAssessment(habitation_id=hab.id, **v_res))
        db.add(CapacityAssessment(habitation_id=hab.id, **c_res))
        db.add(RiskAssessment(habitation_id=hab.id, **r_res))
        db.add(RelocationPriority(habitation_id=hab.id, **p_res))

    db.commit()

    return {
        "dataset_id": dataset.id,
        "summary": summary
    }
