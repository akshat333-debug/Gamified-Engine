"""
LogicForge Backend Configuration
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/logicforge"
    
    # AI Providers
    openai_api_key: str | None = None
    google_api_key: str | None = None
    groq_api_key: str | None = None
    
    # App Config
    app_env: str = "development"
    cors_origins: str = "http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    def model_post_init(self, __context):
        """Post-initialization to fix database URL for Render compatibility."""
        if self.database_url and self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql+asyncpg://", 1)

    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
