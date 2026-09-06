# Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs for Vulnerable Habitations

An AI + GIS based Disaster Risk Assessment and Relocation Decision Support System (DSS) designed to analyze habitation-level environmental, topographical, demographic, infrastructure, and historical disaster data.

---

## 🌟 Key Features

1. **Multi-Hazard Risk Engine**: Evaluates Landslide, Flood, Earthquake, and Extreme Rainfall hazard sub-scores.
2. **Social & Infrastructure Vulnerability**: Assesses population density, housing quality, and emergency healthcare/road access isolation.
3. **Carrying Capacity Assessment**: Estimates safe population capacity ($C_{safe}$) based on land availability, water resources, healthcare, and road transit limits to compute overcapacity counts.
4. **Relocation Priority Scoring ($RPS$)**: Ranks habitations requiring urgent authority review using clear decision-support wording.
5. **Candidate Target Site Suitability Ranking**: Ranks candidate relocation target sites based on safe distance, available land, water, road connectivity, and capacity fit.
6. **Interactive GIS Map**: Leaflet map interface with OpenStreetMap tiles, risk color markers (Green, Yellow, Orange, Red), layer toggles, and popups.
7. **Explainable AI (XAI)**: Deconstructs composite risk scores into factor attributions with SHAP feature importances.
8. **Executive Dashboard**: KPI metric cards, Recharts visualizations, and top critical habitations table.
9. **Data Ingestion Validation Engine**: Pre-ingestion CSV sanity checking for coordinate bounds, missing values, duplicate codes, and negative populations.
10. **Official PDF Reports**: Downloadable ReportLab PDF analytical reports with executive summaries, profile tables, and disclaimers.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Leaflet (`react-leaflet`), Recharts, Lucide Icons, Vite
- **Backend**: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, ReportLab PDF, PyJWT, Passlib
- **Database**: PostgreSQL / PostGIS (or SQLite fallback for easy local dev)
- **AI/ML Engine**: Scikit-Learn, XGBoost, SHAP, NumPy, Pandas

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
API Documentation available at: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access the application UI at: `http://localhost:3000`

---

## 🔐 Default Demo Accounts

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@disaster.gov.in` | `admin123` | Full Administrative & Configuration Control |
| **Disaster Authority** | `authority@disaster.gov.in` | `authority123` | View Risk Maps, Relocation Sites & Reports |
| **Risk Analyst** | `analyst@disaster.gov.in` | `analyst123` | Upload CSV, Run Scoring & Train ML Models |
| **Public Viewer** | `viewer@disaster.gov.in` | `viewer123` | Read-only dashboards and maps |

---

## 📄 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Specifications](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Risk Scoring Methodology](docs/RISK_METHODOLOGY.md)
- [Machine Learning Methodology](docs/ML_METHODOLOGY.md)
- [GIS Strategy](docs/GIS_METHODOLOGY.md)

---

## ⚖️ Decision-Support Disclaimer

This software system functions strictly as an **analytical decision-support system (DSS)**. It does **not** independently order, enforce, or issue mandatory evacuation orders. Final land-use and relocation directives must remain under the official authority of qualified disaster management agencies and on-site geological field validations.
