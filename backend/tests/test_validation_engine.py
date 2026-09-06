import pandas as pd
from app.services.validation_engine import validate_habitation_csv

def test_validation_engine_with_errors():
    df_data = [
        # Valid row
        {
            "habitation_code": "HAB001",
            "name": "Raini Village",
            "district": "Chamoli",
            "latitude": 30.48,
            "longitude": 79.69,
            "population": 1200,
            "households": 240,
            "area_sq_km": 1.2
        },
        # Invalid row: out of bounds latitude & duplicate code
        {
            "habitation_code": "HAB001",
            "name": "Joshimath invalid",
            "district": "Chamoli",
            "latitude": 120.0,
            "longitude": 79.56,
            "population": -50,
            "households": 100,
            "area_sq_km": 1.0
        }
    ]
    df = pd.DataFrame(df_data)
    valid_rows, invalid_rows, summary = validate_habitation_csv(df)

    assert summary["total_rows"] == 2
    assert summary["valid_rows"] == 1
    assert summary["invalid_rows"] == 1
    assert len(summary["reasons"]) == 1
    assert "Duplicate habitation_code" in summary["reasons"][0]["reasons"][0]
