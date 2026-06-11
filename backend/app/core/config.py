from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "NeuroAnalytics"
    ENVIRONMENT: str = "development"
    
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    API_PREFIX: str = "/api"
    
    DATABASE_URL: str = "postgresql://neuro:neuro@localhost:5432/neuroanalytics"
    
    MAX_UPLOAD_SIZE_MB: int = 30
    ALLOWED_EXTENSIONS: str = ".csv,.xlsx,.xls"
    
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
