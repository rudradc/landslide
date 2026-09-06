export type UserRole = "ADMIN" | "AUTHORITY" | "ANALYST" | "VIEWER";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role_name: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface HazardScores {
  landslide_score: number;
  flood_score: number;
  earthquake_score: number;
  rainfall_hazard_score: number;
  composite_hazard_score: number;
}

export interface VulnerabilityScores {
  social_vulnerability: number;
  structural_vulnerability: number;
  accessibility_vulnerability: number;
  composite_vulnerability_score: number;
}

export interface CapacityScores {
  safe_estimated_capacity: number;
  capacity_utilization_pct: number;
  overcapacity_count: number;
  capacity_pressure_score: number;
  bottleneck_resource: string;
}

export interface ContributingFactor {
  factor: string;
  impact_pct: number;
  raw_score: number;
}

export interface RiskScores {
  overall_risk_score: number;
  risk_category: "Low" | "Moderate" | "High" | "Critical";
  contributing_factors: ContributingFactor[];
}

export interface PriorityScores {
  priority_score: number;
  priority_category: string;
}

export interface Habitation {
  id: string;
  dataset_id?: string;
  habitation_code: string;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  population: number;
  households: number;
  area_sq_km: number;
  elevation_m: number;
  slope_deg: number;
  aspect: string;
  soil_type: string;
  land_use: string;
  annual_rainfall_mm: number;
  distance_to_river_m: number;
  distance_to_road_m: number;
  distance_to_hospital_m: number;
  water_availability_index: number;
  housing_quality_index: number;
  safe_land_area_sq_km: number;
  water_capacity_persons: number;
  healthcare_capacity_persons: number;
  road_capacity_persons: number;
  flood_history_count?: number;
  landslide_history_count?: number;
  created_at: string;
  hazard?: HazardScores;
  vulnerability?: VulnerabilityScores;
  capacity?: CapacityScores;
  risk?: RiskScores;
  priority?: PriorityScores;
}

export interface RelocationSite {
  id: string;
  site_code: string;
  name: string;
  district: string;
  latitude: number;
  longitude: number;
  available_land_sq_km: number;
  target_population_capacity: number;
  water_availability_index: number;
  road_connectivity_index: number;
  distance_from_hazard_zone_m: number;
  environmental_suitability_index: number;
  created_at: string;
}

export interface RelocationRecommendation {
  site: RelocationSite;
  suitability_score: number;
  rank_order: number;
  suitability_tier: "Recommended Candidate" | "Alternative Candidate" | "Low Suitability Candidate";
  rationale: {
    distance_km: number;
    proximity_score: number;
    capacity_fit: string;
    water_availability: number;
    road_connectivity: number;
    environmental_suitability: number;
  };
}

export interface RiskSummary {
  total_habitations: number;
  critical_zones: number;
  high_risk_zones: number;
  moderate_risk_zones: number;
  low_risk_zones: number;
  overcapacity_habitations: number;
  relocation_assessment_priority_count: number;
}

export interface RiskConfig {
  weight_hazard: number;
  weight_vulnerability: number;
  weight_capacity: number;
  weight_infrastructure: number;
  weight_history: number;
  threshold_moderate: number;
  threshold_high: number;
  threshold_critical: number;
}

export interface CurrentWeather {
  timestamp: string;
  formatted_datetime: string;
  district: string;
  latitude: number;
  longitude: number;
  temp_c: number;
  temp_feels_like_c: number;
  condition: string;
  condition_code: "heavy_rain" | "thunderstorm" | "rain" | "showers" | "cloudy" | "sunny";
  rainfall_24h_mm: number;
  humidity_pct: number;
  wind_speed_kmh: number;
  wind_direction: string;
  pressure_hpa: number;
  uv_index: number;
  visibility_km: number;
  soil_saturation_pct: number;
  hazard_alert_level: "CRITICAL_RED" | "ORANGE_WARNING" | "MODERATE" | "NORMAL";
}

export interface DailyForecast {
  date: string;
  day_name: string;
  full_day_name: string;
  formatted_date: string;
  is_today: boolean;
  temp_min_c: number;
  temp_max_c: number;
  condition: string;
  condition_code: "heavy_rain" | "thunderstorm" | "rain" | "showers" | "cloudy" | "sunny";
  rainfall_expected_mm: number;
  precipitation_probability_pct: number;
  humidity_pct: number;
  wind_speed_kmh: number;
  landslide_risk_level: "Red Alert" | "Orange Warning" | "Moderate" | "Low";
  hazard_summary: string;
}

export interface WeatherResponse {
  district: string;
  current: CurrentWeather;
  weekly_total_rainfall_mm: number;
  critical_hazard_days_count: number;
  forecast: DailyForecast[];
  districts_available: string[];
  generated_at: string;
}

