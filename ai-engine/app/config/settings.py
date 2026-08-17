from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "kyc-ai-engine"
    api_key: str = "local-ai-engine-key"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    verified_threshold: float = 70.0
    rejected_threshold: float = 45.0

    # MinIO
    minio_endpoint: str = "localhost"
    minio_port: int = 9000
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "kyc-documents"
    minio_secure: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_prefix="AI_", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
