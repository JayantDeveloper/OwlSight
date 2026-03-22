from __future__ import annotations

from dataclasses import replace
from pathlib import Path
from tempfile import mkdtemp

from app.core.config import get_settings
from app.services.demo_state_service import DemoStateService
from app.services.hummingbot_adapter import HummingbotAdapter
from app.services.hummingbot_client import HummingbotSubmissionResult
from app.stores.execution_store import ExecutionStore
from tests.test_execution_store import _build_opportunity


class StubHummingbotClient:
    def __init__(self, accepted: bool, fallback_reason: str | None = None):
        self.accepted = accepted
        self.fallback_reason = fallback_reason

    def get_status(self):
        from app.schemas import HummingbotStatus

        return HummingbotStatus(
            enabled=True,
            state="connected" if self.accepted else "unavailable",
            message="stub",
            api_url="http://localhost:15888",
            instance_name="paper-demo",
            paper_trade=True,
        )

    def paper_trade_market(self, asset_symbol: str):
        normalized_symbol = "BTC" if asset_symbol == "WBTC" else asset_symbol
        return "binance_paper_trade", f"{normalized_symbol}-USDT"

    def submit_paper_trade_execution(self, request):
        if self.accepted:
            return HummingbotSubmissionResult(
                accepted=True,
                submission_target="hummingbot:paper-demo",
                remote_execution_id="paper-demo",
                fallback_reason=None,
                response_payload={"id": "paper-demo"},
            )

        return HummingbotSubmissionResult(
            accepted=False,
            submission_target="mock-execution-engine",
            remote_execution_id=None,
            fallback_reason=self.fallback_reason
            or "Hummingbot unavailable, used mock fallback.",
            response_payload=None,
        )


def _build_settings(**overrides):
    settings = get_settings()
    base_overrides = {"request_dir": Path(mkdtemp())}
    base_overrides.update(overrides)
    return replace(settings, **base_overrides)


def test_mock_execution_mode_stays_mock():
    settings = _build_settings(execution_mode="mock")
    adapter = HummingbotAdapter(
        settings,
        ExecutionStore(),
        StubHummingbotClient(accepted=True),
        DemoStateService(),
    )

    execution = adapter.submit_opportunity(_build_opportunity(execute=True))

    assert execution.execution_mode_requested == "mock"
    assert execution.execution_mode_used == "mock"
    assert execution.fallback_reason is None


def test_paper_hummingbot_mode_uses_hummingbot_when_available():
    settings = _build_settings(execution_mode="paper_hummingbot")
    adapter = HummingbotAdapter(
        settings,
        ExecutionStore(),
        StubHummingbotClient(accepted=True),
        DemoStateService(),
    )

    execution = adapter.submit_opportunity(_build_opportunity(execute=True))

    assert execution.execution_mode_requested == "paper_hummingbot"
    assert execution.execution_mode_used == "paper_hummingbot"


def test_paper_hummingbot_mode_falls_back_to_mock():
    settings = _build_settings(execution_mode="paper_hummingbot")
    adapter = HummingbotAdapter(
        settings,
        ExecutionStore(),
        StubHummingbotClient(
            accepted=False,
            fallback_reason="Hummingbot unavailable, used mock fallback.",
        ),
        DemoStateService(),
    )

    execution = adapter.submit_opportunity(_build_opportunity(execute=True))

    assert execution.execution_mode_used == "paper_hummingbot_fallback_to_mock"
    assert execution.fallback_reason == "Hummingbot unavailable, used mock fallback."


def test_fallback_scenario_forces_mock_failover_even_if_hummingbot_is_available():
    demo_state = DemoStateService()
    demo_state.arm_scenario("fallback")
    settings = _build_settings(execution_mode="paper_hummingbot")
    adapter = HummingbotAdapter(
        settings,
        ExecutionStore(),
        StubHummingbotClient(accepted=True),
        demo_state,
    )

    execution = adapter.submit_opportunity(_build_opportunity(execute=True))

    assert execution.execution_mode_used == "paper_hummingbot_fallback_to_mock"
    assert execution.fallback_used is True
