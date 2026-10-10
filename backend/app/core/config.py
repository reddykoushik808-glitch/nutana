from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
from pydantic import field_validator

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "nutana_db"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    JWT_SECRET: str = "nutana_super_secret_dev_key_for_testing_purposes_only_32_chars!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    COOKIE_SECURE: bool = False
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://localhost:8000"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
