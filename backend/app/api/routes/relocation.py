from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import RelocationSite, Habitation, RelocationRecommendation
from app.schemas.relocation import RelocationSiteResponse, RelocationSiteCreate, RecommendationResponse
from app.services.relocation_engine import rank_relocation_sites
from app.api.deps import RoleChecker

router = APIRouter()

@router.get("/sites", response_model=List[RelocationSiteResponse])
def list_relocation_sites(db: Session = Depends(get_db)):
    return db.query(RelocationSite).all()

@router.post("/sites", response_model=RelocationSiteResponse)
def create_relocation_site(
    site_in: RelocationSiteCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN", "ANALYST"]))
):
    existing = db.query(RelocationSite).filter(RelocationSite.site_code == site_in.site_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Relocation site code already exists")
    
    site = RelocationSite(**site_in.model_dump())
    db.add(site)
    db.commit()
    db.refresh(site)
    return site

@router.get("/recommendations/{habitation_id}")
def get_recommendations_for_habitation(habitation_id: str, db: Session = Depends(get_db)):
    hab = db.query(Habitation).filter(Habitation.id == habitation_id).first()
    if not hab:
        raise HTTPException(status_code=404, detail="Habitation not found")

    sites = db.query(RelocationSite).all()
    if not sites:
        return []

    sites_dicts = [s.__dict__ for s in sites]
    ranked = rank_relocation_sites(hab.__dict__, sites_dicts)

    # Format output for response
    output = []
    for item in ranked:
        output.append({
            "site": item["site"],
            "suitability_score": item["suitability_score"],
            "rank_order": item["rank_order"],
            "suitability_tier": item["suitability_tier"],
            "rationale": item["rationale"]
        })
    return output
