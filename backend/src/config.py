from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    DATABASE_URL:str
    JWT_SECRET_KEY:str
    JWT_ALGORITHM:str = "HS256"
    REDIS_URL:str

    MAIL_USERNAME:str
    MAIL_PASSWORD:str
    MAIL_FROM:str
    MAIL_PORT:int
    MAIL_SERVER:str
    MAIL_FROM_NAME:str = "IncidentHub"
    MAIL_STARTTLS:bool = True
    MAIL_SSL_TLS:bool = False
    USE_CREDENTIALS:bool = True
    VALIDATE_CERTS:bool = True

    FRONTEND_URL:str = "http://localhost:3000"
    CORS_ORIGINS:list[str] = ["http://localhost:3000"]
    TRUSTED_HOSTS:list[str] = ["localhost", "127.0.0.1", "0.0.0.0"]
    COOKIE_SECURE:bool = False

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

# Celery reads these conventional lowercase names through config_from_object.
broker_url = settings.REDIS_URL
result_backend = settings.REDIS_URL
broker_connection_retry_on_startup = True
