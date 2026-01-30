"""
애플리케이션 설정
환경 변수 및 기본 설정을 관리
"""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """애플리케이션 설정 클래스"""

    # 기본 설정
    APP_NAME: str = "FORMTION"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # 서버 설정
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # 데이터베이스 설정
    DATABASE_URL: str = "sqlite+aiosqlite:///./formtion.db"

    # JWT 설정
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7일

    # CORS 설정
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3002", "http://localhost:5173"]

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Webhook 설정
    WEBHOOK_MAX_RETRIES: int = 2
    WEBHOOK_TIMEOUT_SECONDS: int = 10

    # Discord 알림 설정
    DISCORD_SIGNUP_WEBHOOK_URL: str = "https://discord.com/api/webhooks/1466595976965001439/TeSP8g7VZaDtEbEk1kCzH7uCA9S2Z2KV74LeBPuzu2ktxRGipJyOMK4TSL_kj7l3lmoq"

    # 프론트엔드 URL
    FRONTEND_URL: str = "http://localhost:3000"

    # 공유 링크 기본 도메인
    PUBLIC_DOMAIN: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """설정 인스턴스를 캐시하여 반환"""
    return Settings()


settings = get_settings()


