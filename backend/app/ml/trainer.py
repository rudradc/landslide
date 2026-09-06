import numpy as np
import pandas as pd
from typing import Dict, Any
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import xgboost as xgb

def train_risk_classification_models(habitations_data: list) -> Dict[str, Any]:
    """
    Trains baseline Logistic Regression, Random Forest, and XGBoost models
    on habitation risk features.
    """
    if len(habitations_data) < 10:
        return {
            "error": "Insufficient data to train ML models. At least 10 habitation records required.",
            "is_trained": False
        }

    df = pd.DataFrame(habitations_data)
    
    # Feature columns
    feature_cols = [
        "slope_deg", "annual_rainfall_mm", "distance_to_river_m",
        "distance_to_road_m", "distance_to_hospital_m", "housing_quality_index",
        "elevation_m", "flood_history_count", "landslide_history_count", "population"
    ]
    
    # Fill defaults for any missing feature
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0.0
        df[col] = df[col].fillna(df[col].mean() if len(df) > 0 else 0.0)

    X = df[feature_cols]

    # Target: Risk category mapped to integer (0: Low, 1: Moderate, 2: High, 3: Critical)
    category_map = {"Low": 0, "Moderate": 1, "High": 2, "Critical": 3}
    if "risk_category" in df.columns:
        y = df["risk_category"].map(category_map).fillna(0).astype(int)
    else:
        # Generate baseline threshold fallback
        y = (df["slope_deg"] * 0.4 + df["annual_rainfall_mm"] * 0.02 > 50).astype(int)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    # Train Random Forest
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)
    rf_preds = rf_model.predict(X_test)

    # Train XGBoost
    xgb_model = xgb.XGBClassifier(n_estimators=100, max_depth=4, random_state=42, eval_metric='logloss')
    xgb_model.fit(X_train, y_train)
    xgb_preds = xgb_model.predict(X_test)

    # Train Logistic Regression
    lr_model = LogisticRegression(max_iter=500, random_state=42)
    lr_model.fit(X_train, y_train)
    lr_preds = lr_model.predict(X_test)

    def get_metrics(preds, model_name):
        acc = float(accuracy_score(y_test, preds))
        prec = float(precision_score(y_test, preds, average='weighted', zero_division=0))
        rec = float(recall_score(y_test, preds, average='weighted', zero_division=0))
        f1 = float(f1_score(y_test, preds, average='weighted', zero_division=0))
        cm = confusion_matrix(y_test, preds).tolist()
        return {
            "model_name": model_name,
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": cm
        }

    rf_metrics = get_metrics(rf_preds, "Random Forest Classifier")
    xgb_metrics = get_metrics(xgb_preds, "XGBoost Classifier")
    lr_metrics = get_metrics(lr_preds, "Logistic Regression")

    # Global Feature Importance from XGBoost
    importances = xgb_model.feature_importances_.tolist()
    feature_importance = [
        {"feature": name, "importance": round(float(imp), 4)}
        for name, imp in zip(feature_cols, importances)
    ]
    feature_importance.sort(key=lambda x: x["importance"], reverse=True)

    return {
        "is_trained": True,
        "sample_size": len(df),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "models": {
            "random_forest": rf_metrics,
            "xgboost": xgb_metrics,
            "logistic_regression": lr_metrics
        },
        "feature_importance": feature_importance
    }
