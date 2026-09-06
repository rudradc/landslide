import pandas as pd
from typing import Tuple, List, Dict, Any

REQUIRED_FIELDS = [
    "habitation_code", "name", "district", "latitude", "longitude",
    "population", "households", "area_sq_km"
]

def validate_habitation_csv(df: pd.DataFrame) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
    """
    Validates imported pandas DataFrame.
    Returns (valid_rows, invalid_rows, validation_summary).
    """
    valid_rows = []
    invalid_rows = []
    error_reasons = []

    seen_codes = set()

    for idx, row in df.iterrows():
        row_dict = row.to_dict()
        row_num = idx + 2  # 1-indexed header offset
        reasons = []

        # Check required fields
        for field in REQUIRED_FIELDS:
            if field not in row_dict or pd.isna(row_dict[field]):
                reasons.append(f"Missing required field: '{field}'")

        code = str(row_dict.get("habitation_code", "")).strip()
        if not code or code.lower() == "nan":
            reasons.append("Invalid or empty habitation_code")
        elif code in seen_codes:
            reasons.append(f"Duplicate habitation_code '{code}'")
        else:
            seen_codes.add(code)

        # Coordinate check
        try:
            lat = float(row_dict.get("latitude", 0))
            lon = float(row_dict.get("longitude", 0))
            if not (-90 <= lat <= 90):
                reasons.append(f"Latitude out of bounds [-90, 90]: {lat}")
            if not (-180 <= lon <= 180):
                reasons.append(f"Longitude out of bounds [-180, 180]: {lon}")
        except (ValueError, TypeError):
            reasons.append("Invalid numeric coordinates for latitude/longitude")

        # Population & Household check
        try:
            pop = int(row_dict.get("population", 0))
            if pop < 0:
                reasons.append(f"Negative population: {pop}")
        except (ValueError, TypeError):
            reasons.append("Non-numeric value for population")

        try:
            hh = int(row_dict.get("households", 0))
            if hh < 0:
                reasons.append(f"Negative households count: {hh}")
        except (ValueError, TypeError):
            reasons.append("Non-numeric value for households")

        if len(reasons) == 0:
            valid_rows.append(row_dict)
        else:
            row_dict["_row_number"] = row_num
            row_dict["_reasons"] = "; ".join(reasons)
            invalid_rows.append(row_dict)
            error_reasons.append({
                "row": row_num,
                "habitation_code": code,
                "reasons": reasons
            })

    summary = {
        "total_rows": len(df),
        "valid_rows": len(valid_rows),
        "invalid_rows": len(invalid_rows),
        "reasons": error_reasons
    }

    return valid_rows, invalid_rows, summary
