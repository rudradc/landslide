# API Reference Documentation

## Authentication Endpoints (`/api/auth`)
- `POST /api/auth/login`: Authenticates email and password, returning a JWT token and user profile.
- `GET /api/auth/me`: Returns currently authenticated user details.

## Habitation Management Endpoints (`/api/habitations`)
- `GET /api/habitations`: Lists habitations with district and risk filtering.
- `GET /api/habitations/{id}`: Returns single habitation details.
- `POST /api/habitations`: Creates new habitation.
- `PUT /api/habitations/{id}`: Updates habitation properties.
- `DELETE /api/habitations/{id}`: Deletes habitation record.

## Analysis Endpoints (`/api/analysis`)
- `GET /api/analysis/summary`: Returns KPI totals for Dashboard.
- `GET /api/analysis/red-zones`: Returns GeoJSON FeatureCollection of habitations for Leaflet GIS.
- `POST /api/analysis/run`: Triggers recalculation of risk scores.

## Machine Learning Endpoints (`/api/ml`)
- `POST /api/ml/train`: Trains Random Forest, XGBoost, and Logistic Regression models.
- `GET /api/ml/performance`: Returns accuracy, precision, recall, F1 metrics, and confusion matrix.
- `GET /api/ml/feature-importance`: Returns SHAP feature importances.
