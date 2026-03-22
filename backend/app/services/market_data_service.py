from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import Lock
from typing import Callable, Dict, List, Optional

import httpx

from app.core.config import Settings
from app.schemas import MarketDataStatus, MarketQuote


class MarketDataProviderError(RuntimeError):
    pass


@dataclass(frozen=True)
class MarketSnapshot:
    source: str
    quotes: List[MarketQuote]
    market_data_status: MarketDataStatus


class MarketDataService:
    BIRDEYE_BASE_URL = "https://public-api.birdeye.so"
    PROVIDER_LABELS = {
        "mock": "Mock",
        "birdeye": "Birdeye",
        "coingecko": "CoinGecko",
    }
    COINGECKO_BASE_URLS = {
        "demo": "https://api.coingecko.com/api/v3",
        "pro": "https://pro-api.coingecko.com/api/v3",
    }
    MIN_BIRDEYE_REQUEST_INTERVAL_SECONDS = 1.05
    BIRDEYE_SOLANA_ADDRESSES = {
        "SOL": "So11111111111111111111111111111111111111112",
        "ETH": "7vfCXTUXx5WawVxs2CGUZ2e8sKJB4L9H4CeA7qgN5pR",
        "WBTC": "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
    }
    COINGECKO_IDS = {
        "SOL": "solana",
        "ETH": "ethereum",
        "WBTC": "wrapped-bitcoin",
    }

    def __init__(
        self,
        data_path: Path,
        settings: Settings,
        http_client: Optional[httpx.Client] = None,
        sleep_fn: Callable[[float], None] = time.sleep,
        monotonic_fn: Callable[[], float] = time.monotonic,
    ) -> None:
        raw_payload = json.loads(data_path.read_text())
        self._settings = settings
        self._asset_profiles: Dict[str, Dict[str, float]] = raw_payload["assets"]
        self._quotes_seed: List[Dict[str, object]] = raw_payload["quotes"]
        self._client = http_client or httpx.Client(timeout=8.0)
        self._sleep = sleep_fn
        self._monotonic = monotonic_fn
        self._lock = Lock()
        self._last_birdeye_request_monotonic = 0.0
        self._cache: Optional[MarketSnapshot] = None
        self._cache_expires_at_monotonic = 0.0
        self._cache_provider: Optional[str] = None

    def get_asset_profiles(self) -> Dict[str, Dict[str, float]]:
        return self._asset_profiles

    def get_market_quotes(self, now: Optional[datetime] = None) -> List[MarketQuote]:
        return self.get_market_snapshot(now=now).quotes

    def get_market_snapshot(self, now: Optional[datetime] = None) -> MarketSnapshot:
        now = now or datetime.now(timezone.utc)
        provider = self._settings.market_data_provider

        if provider == "birdeye":
            try:
                return self._get_birdeye_snapshot(now=now)
            except MarketDataProviderError as exc:
                return self._build_mock_snapshot(
                    now=now,
                    configured_provider="birdeye",
                    fallback_reason=str(exc),
                )

        if provider == "coingecko":
            try:
                return self._get_coingecko_snapshot(now=now)
            except MarketDataProviderError as exc:
                return self._build_mock_snapshot(
                    now=now,
                    configured_provider="coingecko",
                    fallback_reason=str(exc),
                )

        return self._build_mock_snapshot(now=now, configured_provider="mock")

    def _build_mock_quotes(self, now: datetime) -> List[MarketQuote]:
        bucket = int(now.timestamp() // 15)
        quotes: List[MarketQuote] = []
        for seed in self._quotes_seed:
            jitter_bps = self._deterministic_jitter_bps(
                seed["quote_id"], bucket, float(seed["max_jitter_bps"])
            )
            freshness = self._deterministic_freshness(seed["quote_id"], bucket)
            price = round(float(seed["price_usd"]) * (1 + (jitter_bps / 10_000)), 2)
            observed_at = now - timedelta(seconds=freshness)

            quotes.append(
                MarketQuote(
                    quote_id=str(seed["quote_id"]),
                    asset_symbol=str(seed["asset_symbol"]),
                    chain=str(seed["chain"]),
                    venue=str(seed["venue"]),
                    pair=str(seed["pair"]),
                    price_usd=price,
                    fee_bps=float(seed["fee_bps"]),
                    available_liquidity_usd=float(seed["available_liquidity_usd"]),
                    depth_score=float(seed["depth_score"]),
                    freshness_seconds=freshness,
                    observed_at=observed_at,
                )
            )

        return quotes

    def _build_mock_snapshot(
        self,
        *,
        now: datetime,
        configured_provider: str,
        fallback_reason: Optional[str] = None,
    ) -> MarketSnapshot:
        connection_status = "mock" if configured_provider == "mock" else "fallback_to_mock"
        label = "Mock Feed" if configured_provider == "mock" else "Mock Fallback"
        message = (
            "Deterministic mock market snapshot active."
            if configured_provider == "mock"
            else (
                f"{self.PROVIDER_LABELS[configured_provider]} unavailable. Falling back to mock "
                "market snapshot."
            )
        )
        return MarketSnapshot(
            source="mock",
            quotes=self._build_mock_quotes(now=now),
            market_data_status=MarketDataStatus(
                configured_provider=configured_provider,
                actual_provider="mock",
                connection_status=connection_status,
                label=label,
                message=message,
                fallback_reason=fallback_reason,
            ),
        )

    def _get_birdeye_snapshot(self, now: datetime) -> MarketSnapshot:
        return self._get_live_snapshot(
            now=now,
            provider="birdeye",
            fetcher=self._fetch_birdeye_prices,
            missing_key_reason="Missing Birdeye API key.",
        )

    def _get_coingecko_snapshot(self, now: datetime) -> MarketSnapshot:
        return self._get_live_snapshot(
            now=now,
            provider="coingecko",
            fetcher=self._fetch_coingecko_prices,
            missing_key_reason="Missing CoinGecko API key.",
        )

    def _get_live_snapshot(
        self,
        *,
        now: datetime,
        provider: str,
        fetcher: Callable[[datetime], Dict[str, Dict[str, object]]],
        missing_key_reason: str,
    ) -> MarketSnapshot:
        with self._lock:
            current_time = self._monotonic()
            if (
                self._cache
                and current_time < self._cache_expires_at_monotonic
                and self._cache_provider == provider
            ):
                return self._cache

            if provider == "birdeye" and not self._settings.birdeye_api_key:
                raise MarketDataProviderError(missing_key_reason)
            if provider == "coingecko" and not self._settings.coingecko_api_key:
                raise MarketDataProviderError(missing_key_reason)

            mock_quotes = self._build_mock_quotes(now=now)
            live_prices = fetcher(now=now)
            anchored_quotes = self._apply_live_anchor_prices(
                mock_quotes=mock_quotes,
                live_prices=live_prices,
            )
            snapshot = MarketSnapshot(
                source=provider,
                quotes=anchored_quotes,
                market_data_status=MarketDataStatus(
                    configured_provider=self._settings.market_data_provider,
                    actual_provider=provider,
                    connection_status="live",
                    label=f"{self.PROVIDER_LABELS[provider]} Live",
                    message=f"{self.PROVIDER_LABELS[provider]} live anchor prices applied.",
                    fallback_reason=None,
                ),
            )
            self._cache = snapshot
            self._cache_provider = provider
            self._cache_expires_at_monotonic = (
                current_time + self._settings.cache_ttl_seconds
            )
            return snapshot

    def _fetch_birdeye_prices(self, now: datetime) -> Dict[str, Dict[str, object]]:
        live_prices: Dict[str, Dict[str, object]] = {}
        for asset_symbol, address in self.BIRDEYE_SOLANA_ADDRESSES.items():
            live_prices[asset_symbol] = self._fetch_birdeye_price(
                asset_symbol=asset_symbol,
                address=address,
                now=now,
            )
        return live_prices

    def _fetch_birdeye_price(
        self, asset_symbol: str, address: str, now: datetime
    ) -> Dict[str, object]:
        self._throttle_birdeye_requests()
        try:
            response = self._client.get(
                f"{self.BIRDEYE_BASE_URL}/defi/price",
                params={"address": address},
                headers={
                    "X-API-KEY": self._settings.birdeye_api_key,
                    "x-chain": "solana",
                    "accept": "application/json",
                },
            )
        except httpx.HTTPError as exc:
            raise MarketDataProviderError(
                f"Birdeye request transport failed for {asset_symbol}."
            ) from exc

        if response.status_code == 429:
            raise MarketDataProviderError("Birdeye rate limit hit.")
        if response.status_code >= 400:
            raise MarketDataProviderError(
                f"Birdeye request failed for {asset_symbol}: {response.status_code}"
            )

        payload = self._safe_json(response, provider="Birdeye", asset_symbol=asset_symbol)
        if payload.get("success") is False:
            raise MarketDataProviderError(
                f"Birdeye returned an unsuccessful payload for {asset_symbol}."
            )

        data = payload.get("data") or {}
        price = self._extract_price_from_mapping(data)
        observed_at = self._extract_observed_at(
            unix_time=data.get("updateUnixTime") or data.get("unixTime"),
            fallback=now,
        )
        return {
            "price_usd": price,
            "observed_at": observed_at,
            "freshness_seconds": max(1, int((now - observed_at).total_seconds())),
        }

    def _fetch_coingecko_prices(self, now: datetime) -> Dict[str, Dict[str, object]]:
        headers = {
            "accept": "application/json",
            self._coingecko_auth_header(): self._settings.coingecko_api_key,
        }
        try:
            response = self._client.get(
                f"{self._coingecko_base_url()}/simple/price",
                params={
                    "ids": ",".join(self.COINGECKO_IDS.values()),
                    "vs_currencies": "usd",
                    "include_last_updated_at": "true",
                },
                headers=headers,
            )
        except httpx.HTTPError as exc:
            raise MarketDataProviderError(
                "CoinGecko request transport failed."
            ) from exc

        if response.status_code == 429:
            raise MarketDataProviderError("CoinGecko rate limit hit.")
        if response.status_code >= 400:
            raise MarketDataProviderError(
                f"CoinGecko request failed: {response.status_code}"
            )

        payload = self._safe_json(response, provider="CoinGecko", asset_symbol="multi")
        live_prices: Dict[str, Dict[str, object]] = {}

        for asset_symbol, coin_id in self.COINGECKO_IDS.items():
            coin_payload = payload.get(coin_id)
            if not isinstance(coin_payload, dict):
                raise MarketDataProviderError(
                    f"CoinGecko payload missing data for {asset_symbol}."
                )

            price = coin_payload.get("usd")
            if price in (None, ""):
                raise MarketDataProviderError(
                    f"CoinGecko payload missing USD price for {asset_symbol}."
                )

            observed_at = self._extract_observed_at(
                unix_time=coin_payload.get("last_updated_at"),
                fallback=now,
            )
            live_prices[asset_symbol] = {
                "price_usd": round(float(price), 2),
                "observed_at": observed_at,
                "freshness_seconds": max(1, int((now - observed_at).total_seconds())),
            }

        return live_prices

    def _apply_live_anchor_prices(
        self,
        mock_quotes: List[MarketQuote],
        live_prices: Dict[str, Dict[str, object]],
    ) -> List[MarketQuote]:
        mock_anchors = {
            quote.asset_symbol: quote
            for quote in mock_quotes
            if quote.chain == "Solana" and quote.venue == "Jupiter"
        }

        for asset_symbol in self.BIRDEYE_SOLANA_ADDRESSES:
            if asset_symbol not in live_prices or asset_symbol not in mock_anchors:
                raise MarketDataProviderError(
                    f"Missing live or anchor quote for {asset_symbol}."
                )

        anchored_quotes: List[MarketQuote] = []
        for quote in mock_quotes:
            live_asset = live_prices.get(quote.asset_symbol)
            anchor_quote = mock_anchors.get(quote.asset_symbol)
            if live_asset is None or anchor_quote is None:
                anchored_quotes.append(quote)
                continue

            scaling_factor = float(live_asset["price_usd"]) / anchor_quote.price_usd
            anchored_quotes.append(
                quote.model_copy(
                    update={
                        "price_usd": round(quote.price_usd * scaling_factor, 2),
                        "freshness_seconds": int(live_asset["freshness_seconds"]),
                        "observed_at": live_asset["observed_at"],
                    }
                )
            )

        return anchored_quotes

    def _coingecko_auth_header(self) -> str:
        return (
            "x-cg-pro-api-key"
            if self._settings.coingecko_api_tier == "pro"
            else "x-cg-demo-api-key"
        )

    def _coingecko_base_url(self) -> str:
        if self._settings.coingecko_base_url:
            return self._settings.coingecko_base_url
        return self.COINGECKO_BASE_URLS.get(
            self._settings.coingecko_api_tier,
            self.COINGECKO_BASE_URLS["demo"],
        )

    def _throttle_birdeye_requests(self) -> None:
        now = self._monotonic()
        elapsed = now - self._last_birdeye_request_monotonic
        if elapsed < self.MIN_BIRDEYE_REQUEST_INTERVAL_SECONDS:
            self._sleep(self.MIN_BIRDEYE_REQUEST_INTERVAL_SECONDS - elapsed)
        self._last_birdeye_request_monotonic = self._monotonic()

    @staticmethod
    def _safe_json(
        response: httpx.Response,
        *,
        provider: str,
        asset_symbol: str,
    ) -> Dict[str, object]:
        try:
            payload = response.json()
        except ValueError as exc:
            raise MarketDataProviderError(
                f"{provider} returned invalid JSON for {asset_symbol}."
            ) from exc

        if not isinstance(payload, dict):
            raise MarketDataProviderError(
                f"{provider} returned an unexpected payload for {asset_symbol}."
            )
        return payload

    @staticmethod
    def _extract_price_from_mapping(data: Dict[str, object]) -> float:
        for key in ("value", "price", "close"):
            value = data.get(key)
            if value in (None, ""):
                continue
            return round(float(value), 2)
        raise MarketDataProviderError("Live price payload missing price field.")

    @staticmethod
    def _extract_observed_at(unix_time: object, fallback: datetime) -> datetime:
        if unix_time in (None, ""):
            return fallback
        return datetime.fromtimestamp(int(unix_time), tz=timezone.utc)

    @staticmethod
    def _deterministic_jitter_bps(
        quote_id: object, bucket: int, max_jitter_bps: float
    ) -> float:
        digest = hashlib.sha256(f"{quote_id}:{bucket}".encode("utf-8")).hexdigest()
        unit = int(digest[:6], 16) / float(0xFFFFFF)
        return round((unit - 0.5) * 2 * max_jitter_bps, 2)

    @staticmethod
    def _deterministic_freshness(quote_id: object, bucket: int) -> int:
        digest = hashlib.sha256(
            f"freshness:{quote_id}:{bucket}".encode("utf-8")
        ).hexdigest()
        return 4 + (int(digest[-2:], 16) % 16)
