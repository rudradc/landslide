from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Habitation, HazardAssessment, VulnerabilityAssessment, CapacityAssessment, RiskAssessment, RelocationPriority
from app.schemas.habitation import HabitationResponse, HabitationCreate, HabitationUpdate
from app.api.deps import get_current_user, RoleChecker
from app.services.hazard_engine import calculate_hazard_scores
from app.services.vulnerability_engine import calculate_vulnerability_scores
from app.services.capacity_engine import calculate_carrying_capacity
from app.services.risk_engine import calculate_overall_risk
from app.services.priority_engine import calculate_relocation_priority

router = APIRouter()

@router.get("", response_model=List[HabitationResponse])
def list_habitations(
    district: Optional[str] = None,
    risk_category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 500,
    db: Session = Depends(get_db)
):
    query = db.query(Habitation)
    if district:
        query = query.filter(Habitation.district == district)
    if search:
        query = query.filter(Habitation.name.ilike(f"%{search}%"))
    if risk_category:
        query = query.join(Habitation.risk).filter(RiskAssessment.risk_category == risk_category)
    
    return query.offset(skip).limit(limit).all()

@router.get("/{habitation_id}", response_model=HabitationResponse)
def get_habitation(habitation_id: str, db: Session = Depends(get_db)):
    hab = db.query(Habitation).filter(Habitation.id == habitation_id).first()
    if not hab:
        raise HTTPException(status_code=404, detail="Habitation not found")
    return hab

@router.post("", response_model=HabitationResponse)
def create_habitation(
    hab_in: HabitationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN", "ANALYST"]))
):
    existing = db.query(Habitation).filter(Habitation.habitation_code == hab_in.habitation_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Habitation code already exists")
    
    hab_data = hab_in.model_dump()
    hab = Habitation(**hab_data)
    db.add(hab)
    db.commit()
    db.refresh(hab)

    # Compute immediate analytical scores
    h_res = calculate_hazard_scores(hab_data)
    v_res = calculate_vulnerability_scores(hab_data)
    c_res = calculate_carrying_capacity(hab_data)
    r_res = calculate_overall_risk(h_res, v_res, c_res, hab_data)
    p_res = calculate_relocation_priority(r_res, v_res, c_res, hab_data)

    db.add(HazardAssessment(habitation_id=hab.id, **h_res))
    db.add(VulnerabilityAssessment(habitation_id=hab.id, **v_res))
    db.add(CapacityAssessment(habitation_id=hab.id, **c_res))
    db.add(RiskAssessment(habitation_id=hab.id, **r_res))
    db.add(RelocationPriority(habitation_id=hab.id, **p_res))
    
    db.commit()
    db.refresh(hab)
    return hab

@router.put("/{habitation_id}", response_model=HabitationResponse)
def update_habitation(
    habitation_id: str,
    hab_in: HabitationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN", "ANALYST"]))
):
    hab = db.query(Habitation).filter(Habitation.id == habitation_id).first()
    if not hab:
        raise HTTPException(status_code=404, detail="Habitation not found")

    update_data = hab_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(hab, field, val)

    db.commit()
    db.refresh(hab)

    # Recalculate analytical scores
    full_dict = hab.__dict__
    h_res = calculate_hazard_scores(full_dict)
    v_res = calculate_vulnerability_scores(full_dict)
    c_res = calculate_carrying_capacity(full_dict)
    r_res = calculate_overall_risk(h_res, v_res, c_res, full_dict)
    p_res = calculate_relocation_priority(r_res, v_res, c_res, full_dict)

    if hab.hazard:
        for k, v in h_res.items(): setattr(hab.hazard, k, v)
    if hab.vulnerability:
        for k, v in v_res.items(): setattr(hab.vulnerability, k, v)
    if hab.capacity:
        for k, v in c_res.items(): setattr(hab.capacity, k, v)
    if hab.risk:
        for k, v in r_res.items(): setattr(hab.risk, k, v)
    if hab.priority:
        for k, v in p_res.items(): setattr(hab.priority, k, v)

    db.commit()
    db.refresh(hab)
    return hab

@router.delete("/{habitation_id}")
def delete_habitation(
    habitation_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    hab = db.query(Habitation).filter(Habitation.id == habitation_id).first()
    if not hab:
        raise HTTPException(status_code=404, detail="Habitation not found")
    db.delete(hab)
    db.commit()
    return {"message": "Habitation deleted successfully"}
