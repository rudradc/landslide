# GIS Strategy & Geospatial Analysis

## Map Rendering Engine

- **Library**: Leaflet.js with React-Leaflet bindings and OpenStreetMap tile servers.
- **Coordinate Reference System (CRS)**: WGS 84 (EPSG:4326).
- **Geospatial Proximity**: Spatial distance between habitations and candidate relocation target sites is computed using the Haversine formula and PostGIS `ST_Distance`.
- **Map Layers**:
  - Habitation Risk Marker Layer (Color-coded by Risk Level: Green, Yellow, Orange, Red)
  - Candidate Relocation Target Sites Layer (Royal Blue markers)
  - GeoJSON Red-Zone Polygon Buffers
