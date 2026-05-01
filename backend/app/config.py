from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Live Event Intelligence Platform"
    app_version: str = "1.0.0"
    debug: bool = True

    secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    mongodb_uri: str
    mongodb_db_name: str = "live_event_intelligence"

    upstash_redis_rest_url: str
    upstash_redis_rest_token: str
    redis_url: str

    groq_api_key: str
    gemini_api_key: str

    sports_db_api_key: str = "123"
    sports_db_base_url: str = "https://www.thesportsdb.com/api/v1/json"

    use_mock: bool = True

    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()