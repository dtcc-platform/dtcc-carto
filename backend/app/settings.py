import os
from functools import lru_cache
from pydantic import BaseModel, Field


def _env(key: str, default: str) -> str:
    return os.getenv(key, default)


class Settings(BaseModel):
    api_title: str = Field(default_factory=lambda: _env('DTCC_API_TITLE', 'DTCC Cartography API'))
    api_version: str = Field(default_factory=lambda: _env('DTCC_API_VERSION', '0.1.0'))
    frontend_origin: str = Field(default_factory=lambda: _env('DTCC_FRONTEND_ORIGIN', 'http://localhost:5173'))
    overpass_url: str = Field(
        default_factory=lambda: _env('DTCC_OVERPASS_URL', 'https://overpass-api.de/api/interpreter'),
    )


@lru_cache(1)
def get_settings() -> Settings:
    return Settings()
