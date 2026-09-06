from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Habitation
from app.ml.trainer import train_risk_classification_models
from app.api.deps import RoleChecker

router = APIRouter()

# Global memory cache for trained model metrics
_MODEL_CACHE = {
    "is_trained": False,
    "last_result": None
}

@router.post("/train")
def trigger_ml_training(
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN", "ANALYST"]))
):
    habitations = db.query(Habitation).all()
    if not habitations:
        raise HTTPException(status_code=400, detail="No habitations available for ML model training.")

    data = []
    for hab in habitations:
        d = hab.__dict__
        if hab.risk:
            d["risk_category"] = hab.risk.risk_category
        data.append(d)

    res = train_risk_classification_models(data)
    _MODEL_CACHE["is_trained"] = res.get("is_trained", False)
    _MODEL_CACHE["last_result"] = res
    return res

@router.get("/performance")
def get_ml_performance(db: Session = Depends(get_db)):
    if not _MODEL_CACHE["is_trained"] or not _MODEL_CACHE["last_result"]:
        # Auto-train if data exists
        habitations = db.query(Habitation).all()
        if habitations:
            data = [h.__dict__ for h in habitations]
            res = train_risk_classification_models(data)
            _MODEL_CACHE["is_trained"] = res.get("is_trained", False)
            _MODEL_CACHE["last_result"] = res
            return res
        return {
            "is_trained": False,
            "message": "No trained model metrics available yet. Trigger POST /api/ml/train to train models."
        }
    return _MODEL_CACHE["last_result"]

@router.get("/feature-importance")
def get_feature_importance():
    if not _MODEL_CACHE["last_result"]:
        return []
    return _MODEL_CACHE["last_result"].get("feature_importance", [])
