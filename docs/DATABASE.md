# Database Schema Documentation

## PostgreSQL + PostGIS ER Specifications

- `roles`: User roles (`ADMIN`, `AUTHORITY`, `ANALYST`, `VIEWER`).
- `users`: Registered users with hashed passwords and assigned role.
- `habitations`: Core spatial entity storing coordinates, population, slope, rainfall, and infrastructure distance.
- `hazard_assessments`: Landslide, flood, earthquake, extreme rainfall, and composite hazard scores.
- `vulnerability_assessments`: Social density, structural housing quality, and accessibility scores.
- `capacity_assessments`: Safe capacity ($C_{safe}$), overcapacity counts, capacity pressure score, and bottleneck resource.
- `risk_assessments`: Overall composite risk score (0-100), risk category (`Low`, `Moderate`, `High`, `Critical`), and XAI factors.
- `relocation_priorities`: Relocation priority score ($RPS$) and priority category.
- `relocation_sites`: Candidate target sites with safe land area and infrastructure indices.
- `relocation_recommendations`: Ranked candidate sites for each habitation with suitability metrics.
