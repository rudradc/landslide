# Architecture Documentation

## Intelligent Identification of Hazard-Based Red Zones & Relocation DSS

### High-Level System Architecture

The application adopts a decoupled 5-tier architecture:

```
[ Frontend: React + TS + Tailwind + Leaflet ] 
                   │ (HTTP / REST APIs)
                   ▼
[ API Gateway: FastAPI + JWT Security + RBAC ]
                   │
  ┌────────────────┼────────────────┬────────────────┐
  ▼                ▼                ▼                ▼
[ Risk Engine ] [ Capacity ]  [ GIS Engine ]  [ AI/ML Engine ]
  (MCDA Rules)  (Bottlenecks)  (Proximity)    (XGBoost+SHAP)
  └────────────────┼────────────────┴────────────────┘
                   ▼
[ Data Persistence: PostgreSQL + PostGIS ]
```

### Module Responsibilities
- **Frontend SPA**: React 18 with TypeScript providing responsive dark-mode dashboards, interactive Leaflet GIS canvas, data tables, and modal dialogues.
- **FastAPI Backend**: Async Python server executing authentication, MCDA scoring pipelines, ML model training, and PDF generation.
- **Relational & Spatial Database**: PostgreSQL with PostGIS extensions storing user roles, spatial geometries, hazard metrics, capacity assessments, and relocation rankings.
