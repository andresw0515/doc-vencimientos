from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Base de datos
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str = "cambia_esto_en_produccion_con_valor_seguro"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 horas

    # Resend (correo)
    RESEND_API_KEY: str
    EMAIL_FROM: str = "noreply@tuidominio.com"
    EMAIL_FROM_NAME: str = "Doc Vencimientos"

    # App
    APP_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"

    # Alertas (días antes de vencimiento)
    ALERT_DAYS_BEFORE: list[int] = [30, 15, 7, 3, 1]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
