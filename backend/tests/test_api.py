import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert "Disaster Risk Assessment" in response.json()["message"]

def test_auth_login():
    response = client.post("/api/auth/login", json={
        "email": "admin@disaster.gov.in",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role_name"] == "ADMIN"

def test_get_habitations():
    response = client.get("/api/habitations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3

def test_risk_summary():
    response = client.get("/api/analysis/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_habitations" in data
    assert "critical_zones" in data

def test_red_zones_geojson():
    response = client.get("/api/analysis/red-zones")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 3
