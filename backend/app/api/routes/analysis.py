from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Habitation, RiskAssessment, CapacityAssessment, RelocationPriority, RiskConfig
from app.schemas.risk import RiskSummaryResponse
from app.services.hazard_engine import calculate_hazard_scores
from app.services.vulnerability_engine import calculate_vulnerability_scores
from app.services.capacity_engine import calculate_carrying_capacity
from app.services.risk_engine import calculate_overall_risk
from app.services.priority_engine import calculate_relocation_priority
from app.api.deps import RoleChecker

router = APIRouter()

@router.get("/summary", response_model=RiskSummaryResponse)
def get_risk_summary(db: Session = Depends(get_db)):
    total = db.query(Habitation).count()
    critical = db.query(RiskAssessment).filter(RiskAssessment.risk_category == "Critical").count()
    high = db.query(RiskAssessment).filter(RiskAssessment.risk_category == "High").count()
    moderate = db.query(RiskAssessment).filter(RiskAssessment.risk_category == "Moderate").count()
    low = db.query(RiskAssessment).filter(RiskAssessment.risk_category == "Low").count()
    overcapacity = db.query(CapacityAssessment).filter(CapacityAssessment.overcapacity_count > 0).count()
    relocation_priority = db.query(RelocationPriority).filter(RelocationPriority.priority_score >= 50.0).count()

    return {
        "total_habitations": total,
        "critical_zones": critical,
        "high_risk_zones": high,
        "moderate_risk_zones": moderate,
        "low_risk_zones": low,
        "overcapacity_habitations": overcapacity,
        "relocation_assessment_priority_count": relocation_priority
    }

@router.get("/red-zones")
def get_red_zones_geojson(db: Session = Depends(get_db)):
    """
    Returns GeoJSON FeatureCollection of habitations categorized by risk.
    """
    habitations = db.query(Habitation).all()
    features = []

    for hab in habitations:
        risk_score = hab.risk.overall_risk_score if hab.risk else 0.0
        risk_cat = hab.risk.risk_category if hab.risk else "Low"
        priority_score = hab.priority.priority_score if hab.priority else 0.0
        priority_cat = hab.priority.priority_category if hab.priority else "Low"

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [hab.longitude, hab.latitude]
            },
            "properties": {
                "id": hab.id,
                "habitation_code": hab.habitation_code,
                "name": hab.name,
                "district": hab.district,
                "population": hab.population,
                "hazard_score": hab.hazard.composite_hazard_score if hab.hazard else 0.0,
                "vulnerability_score": hab.vulnerability.composite_vulnerability_score if hab.vulnerability else 0.0,
                "capacity_pressure": hab.capacity.capacity_pressure_score if hab.capacity else 0.0,
                "overcapacity_count": hab.capacity.overcapacity_count if hab.capacity else 0,
                "overall_risk_score": risk_score,
                "risk_category": risk_cat,
                "priority_score": priority_score,
                "priority_category": priority_cat,
                "contributing_factors": hab.risk.contributing_factors if hab.risk else []
            }
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.post("/run")
def run_risk_analysis(
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN", "ANALYST"]))
):
    """
    Recalculates hazard, vulnerability, carrying capacity, overall risk,
    and relocation priorities for all habitations in the system.
    """
    config = db.query(RiskConfig).first()
    weights = None
    if config:
        weights = {
            "weight_hazard": config.weight_hazard,
            "weight_vulnerability": config.weight_vulnerability,
            "weight_capacity": config.weight_capacity,
            "weight_infrastructure": config.weight_infrastructure,
            "weight_history": config.weight_history,
            "threshold_moderate": config.threshold_moderate,
            "threshold_high": config.threshold_high,
            "threshold_critical": config.threshold_critical
        }

    habitations = db.query(Habitation).all()
    count = 0

    for hab in habitations:
        hab_dict = hab.__dict__
        h_res = calculate_hazard_scores(hab_dict)
        v_res = calculate_vulnerability_scores(hab_dict)
        c_res = calculate_carrying_capacity(hab_dict)
        r_res = calculate_overall_risk(h_res, v_res, c_res, hab_dict, weights)
        p_res = calculate_relocation_priority(r_res, v_res, c_res, hab_dict)

        # Update or create child assessment models
        if hab.hazard:
            for k, v in h_res.items(): setattr(hab.hazard, k, v)
        else:
            db.add(HazardAssessment(habitation_id=hab.id, **h_res))

        if hab.vulnerability:
            for k, v in v_res.items(): setattr(hab.vulnerability, k, v)
        else:
            db.add(VulnerabilityAssessment(habitation_id=hab.id, **v_res))

        if hab.capacity:
            for k, v in c_res.items(): setattr(hab.capacity, k, v)
        else:
            db.add(CapacityAssessment(habitation_id=hab.id, **c_res))

        if hab.risk:
            for k, v in r_res.items(): setattr(hab.risk, k, v)
        else:
            db.add(RiskAssessment(habitation_id=hab.id, **r_res))

        if hab.priority:
            for k, v in p_res.items(): setattr(hab.priority, k, v)
        else:
            db.add(RelocationPriority(habitation_id=hab.id, **p_res))

        count += 1

    db.commit()
    return {"message": f"Successfully re-analyzed risk for {count} habitations."}
