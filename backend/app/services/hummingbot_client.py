from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from time import monotonic
from typing import Any, Dict, Optional, Tuple

import httpx

from app.core.config import Settings
from app.schemas import HummingbotStatus, TradeExecutionRequest


@dataclass(frozen=True)
class HummingbotSubmissionResult:
    accepted: bool
    submission_target: str
    remote_execution_id: Optional[str]
    fallback_reason: Optional[str]
    response_payload: Optional[Dict[str, Any]]


class HummingbotClient:
    HEALTH_ENDPOINT_CANDIDATES: Tuple[str, ...] = ("/health", "/docs", "/")
    SUBMIT_ENDPOINT_CANDIDATES: Tuple[str, ...] = (
        "/bots/{instance}/start",
        "/bot-orchestration/bots/{instance}/start",
        "/api/v1/bots/{instance}/start",
        "/bots/start",
    )
    STATUS_ENDPOINT_CANDIDATES: Tuple[str, ...] = (
        "/bots/{instance}/status",
        "/bot-orchestration/bots/{instance}/status",
        "/api/v1/bots/{instance}/status",
    )
    HEALTH_CACHE_TTL_SECONDS = 5.0
    PAPER_TRADE_CONNECTOR = "binance_paper_trade"

    def __init__(
        self,
        settings: Settings,
        http_client: Optional[httpx.Client] = None,
    ) -> None:
        self._settings = settings
        self._client = http_client or httpx.Client(
            base_url=settings.hummingbot_api_url,
            timeout=6.0,
        )
        self._status_cache: Optional[HummingbotStatus] = None
        self._status_cache_expires_at = 0.0
        self._lock = Lock()

    def paper_trade_market(self, asset_symbol: str) -> Tuple[str, str]:
        normalized_symbol = "BTC" if asset_symbol == "WBTC" else asset_symbol
        return self.PAPER_TRADE_CONNECTOR, f"{normalized_symbol}-USDT"

    def get_status(self, force_refresh: bool = False) -> HummingbotStatus:
        if not self._settings.hummingbot_enabled:
            return self._unavailable_status("Hummingbot integration disabled in env.")
        if not self._settings.hummingbot_paper_trade:
            return self._unavailable_status("Hummingbot paper-trade mode is disabled.")

        with self._lock:
            current_time = monotonic()
            if (
                not force_refresh
                and self._status_cache is not None
                and current_time < self._status_cache_expires_at
            ):
                return self._status_cache

            last_error = "Hummingbot control surface did not respond."
            for path in self.HEALTH_ENDPOINT_CANDIDATES:
                try:
                    response = self._client.get(path)
                except httpx.HTTPError as exc:
                    last_error = f"Hummingbot unavailable at {self._settings.hummingbot_api_url}: {exc}"
                    continue

                if 200 <= response.status_code < 400:
                    self._status_cache = HummingbotStatus(
                        enabled=True,
                        state="connected",
                        message=(
                            "Hummingbot control surface reachable. Paper-trade submission "
                            "will be attempted at execution time."
                        ),
                        api_url=self._settings.hummingbot_api_url,
                        instance_name=self._settings.hummingbot_instance_name,
                        paper_trade=self._settings.hummingbot_paper_trade,
                    )
                    self._status_cache_expires_at = (
                        current_time + self.HEALTH_CACHE_TTL_SECONDS
                    )
                    return self._status_cache

                last_error = (
                    f"Hummingbot health probe returned {response.status_code} at {path}."
                )

            self._status_cache = self._unavailable_status(last_error)
            self._status_cache_expires_at = current_time + self.HEALTH_CACHE_TTL_SECONDS
            return self._status_cache

    def submit_paper_trade_execution(
        self, request: TradeExecutionRequest
    ) -> HummingbotSubmissionResult:
        status = self.get_status(force_refresh=True)
        if status.state != "connected":
            return HummingbotSubmissionResult(
                accepted=False,
                submission_target="mock-execution-engine",
                remote_execution_id=None,
                fallback_reason="Hummingbot unavailable, used mock fallback.",
                response_payload=None,
            )

        payload = self._build_submission_payload(request)
        errors: list[str] = []

        for path in self.SUBMIT_ENDPOINT_CANDIDATES:
            formatted_path = path.format(instance=self._settings.hummingbot_instance_name)
            try:
                response = self._client.post(formatted_path, json=payload)
            except httpx.HTTPError as exc:
                errors.append(f"{formatted_path}: {exc}")
                continue

            if 200 <= response.status_code < 300:
                response_payload = self._safe_json(response)
                remote_execution_id = self._extract_remote_execution_id(response_payload)
                return HummingbotSubmissionResult(
                    accepted=True,
                    submission_target=f"hummingbot:{self._settings.hummingbot_instance_name}",
                    remote_execution_id=remote_execution_id,
                    fallback_reason=None,
                    response_payload=response_payload,
                )

            errors.append(f"{formatted_path}: HTTP {response.status_code}")

        return HummingbotSubmissionResult(
            accepted=False,
            submission_target="mock-execution-engine",
            remote_execution_id=None,
            fallback_reason=(
                "Hummingbot control surface reachable, but no compatible paper-trade "
                "start endpoint accepted the request."
            ),
            response_payload={"errors": errors},
        )

    def poll_execution_status(self, instance_name: Optional[str] = None) -> Optional[str]:
        if not self._settings.hummingbot_enabled:
            return None

        target_instance = instance_name or self._settings.hummingbot_instance_name
        for path in self.STATUS_ENDPOINT_CANDIDATES:
            formatted_path = path.format(instance=target_instance)
            try:
                response = self._client.get(formatted_path)
            except httpx.HTTPError:
                continue

            if 200 <= response.status_code < 300:
                payload = self._safe_json(response)
                for key in ("status", "state", "bot_status"):
                    value = payload.get(key)
                    if isinstance(value, str) and value:
                        return value
        return None

    def _build_submission_payload(
        self, request: TradeExecutionRequest
    ) -> Dict[str, Any]:
        # Hummingbot control APIs vary across deployments. Keep the assumptions
        # isolated here and send a request shaped around common bot-start concepts.
        return {
            "name": self._settings.hummingbot_instance_name,
            "script": "cross_chain_execution_copilot_paper_trade",
            "config": {
                "paper_trade": True,
                "connector": request.paper_trade_connector,
                "trading_pair": request.symbol,
                "side": request.side,
                "notional_usd": request.notional_usd,
                "asset_amount": request.asset_amount,
                "metadata": {
                    "request_id": request.request_id,
                    "opportunity_id": request.opportunity_id,
                    "source_chain": request.source_chain,
                    "source_venue": request.source_venue,
                    "destination_chain": request.destination_chain,
                    "destination_venue": request.destination_venue,
                    "bridge_pair": request.bridge_pair,
                },
                "guardrails": request.guardrails.model_dump(mode="json"),
            },
        }

    def _unavailable_status(self, message: str) -> HummingbotStatus:
        return HummingbotStatus(
            enabled=self._settings.hummingbot_enabled,
            state="unavailable",
            message=message,
            api_url=self._settings.hummingbot_api_url,
            instance_name=self._settings.hummingbot_instance_name,
            paper_trade=self._settings.hummingbot_paper_trade,
        )

    @staticmethod
    def _safe_json(response: httpx.Response) -> Dict[str, Any]:
        try:
            payload = response.json()
        except ValueError:
            return {}
        return payload if isinstance(payload, dict) else {}

    def _extract_remote_execution_id(self, payload: Dict[str, Any]) -> str:
        for key in ("id", "bot_id", "instance_name", "name"):
            value = payload.get(key)
            if isinstance(value, str) and value:
                return value
        return self._settings.hummingbot_instance_name
