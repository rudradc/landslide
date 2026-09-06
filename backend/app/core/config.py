import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Disaster Risk Assessment & Relocation DSS"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production-disaster-management-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for dev

    # SQLite fallback for local easy startup, PostgreSQL/PostGIS support
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./disaster_dss.db"
    )

    class Config:
        case_sensitive = True

settings = Settings()
