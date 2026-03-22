from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import List

from dotenv import load_dotenv


def _parse_origins(value: str) -> List[str]:
    return [origin.strip() for origin in value.split(",") if origin.strip()]


def _normalize_provider(value: str) -> str:
    normalized = value.strip().lower()
    if normalized in {"mock", "birdeye", "coingecko"}:
        return normalized
    return "mock"


def _normalize_execution_mode(value: str) -> str:
    normalized = value.strip().lower()
    if normalized in {"mock", "paper_hummingbot"}:
        return normalized
    return "mock"


def _parse_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    return default


@dataclass(frozen=True)
class Settings:
    app_name: str
    api_prefix: str
    backend_dir: Path
    project_root: Path
    mock_market_data_path: Path
    request_dir: Path
    birdeye_api_key: str
    coingecko_api_key: str
    coingecko_api_tier: str
    coingecko_base_url: str
    market_data_provider: str
    execution_mode: str
    hummingbot_enabled: bool
    hummingbot_api_url: str
    hummingbot_instance_name: str
    hummingbot_paper_trade: bool
    demo_force_hb_connected: bool
    cache_ttl_seconds: int
    frontend_origin: str
    backend_cors_origins: List[str]
    opportunity_min_net_profit_usd: float
    confidence_threshold: float


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    backend_dir = Path(__file__).resolve().parents[2]
    project_root = backend_dir.parent
    load_dotenv(backend_dir / ".env")

    request_dir_env = os.getenv("HUMMINGBOT_REQUEST_DIR", "../hummingbot/requests")
    request_dir = (backend_dir / request_dir_env).resolve()
    frontend_origin = os.getenv(
        "FRONTEND_ORIGIN",
        os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000"),
    )

    return Settings(
        app_name="OwlSight API",
        api_prefix="/api",
        backend_dir=backend_dir,
        project_root=project_root,
        mock_market_data_path=backend_dir / "data" / "mock_markets.json",
        request_dir=request_dir,
        birdeye_api_key=os.getenv("BIRDEYE_API_KEY", "").strip(),
        coingecko_api_key=os.getenv("COINGECKO_API_KEY", "").strip(),
        coingecko_api_tier=os.getenv("COINGECKO_API_TIER", "demo").strip().lower(),
        coingecko_base_url=os.getenv("COINGECKO_BASE_URL", "").strip().rstrip("/"),
        market_data_provider=_normalize_provider(
            os.getenv("MARKET_DATA_PROVIDER", "mock")
        ),
        execution_mode=_normalize_execution_mode(os.getenv("EXECUTION_MODE", "mock")),
        hummingbot_enabled=_parse_bool(os.getenv("HUMMINGBOT_ENABLED"), False),
        hummingbot_api_url=os.getenv("HUMMINGBOT_API_URL", "http://localhost:15888").rstrip(
            "/"
        ),
        hummingbot_instance_name=os.getenv(
            "HUMMINGBOT_INSTANCE_NAME", "paper-demo"
        ).strip(),
        hummingbot_paper_trade=_parse_bool(
            os.getenv("HUMMINGBOT_PAPER_TRADE"),
            True,
        ),
        demo_force_hb_connected=_parse_bool(
            os.getenv("DEMO_FORCE_HB_CONNECTED"),
            False,
        ),
        cache_ttl_seconds=int(os.getenv("CACHE_TTL_SECONDS", "20")),
        frontend_origin=frontend_origin,
        backend_cors_origins=_parse_origins(frontend_origin),
        opportunity_min_net_profit_usd=float(
            os.getenv("OPPORTUNITY_MIN_NET_PROFIT_USD", "75")
        ),
        confidence_threshold=float(os.getenv("CONFIDENCE_THRESHOLD", "0.68")),
    )
