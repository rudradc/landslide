from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import RiskConfig
from app.schemas.risk import RiskConfigBase
from app.api.deps import RoleChecker

router = APIRouter()

@router.get("/weights", response_model=RiskConfigBase)
def get_risk_config(db: Session = Depends(get_db)):
    config = db.query(RiskConfig).first()
    if not config:
        config = RiskConfig()
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.put("/weights", response_model=RiskConfigBase)
def update_risk_config(
    config_in: RiskConfigBase,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    # Validate sum of weights equal 1.0 (with slight floating tolerance)
    weight_sum = (
        config_in.weight_hazard +
        config_in.weight_vulnerability +
        config_in.weight_capacity +
        config_in.weight_infrastructure +
        config_in.weight_history
    )
    if abs(weight_sum - 1.0) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Sum of MCDA weights must equal 1.00 (current sum: {round(weight_sum, 3)})"
        )

    config = db.query(RiskConfig).first()
    if not config:
        config = RiskConfig()
        db.add(config)

    for field, val in config_in.model_dump().items():
        setattr(config, field, val)

    db.commit()
    db.refresh(config)
    return config
