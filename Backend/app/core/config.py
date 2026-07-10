from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    HF_API_TOKEN: str = "YOUR_HF_API_TOKEN"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
