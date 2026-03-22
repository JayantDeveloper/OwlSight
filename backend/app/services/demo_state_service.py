from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from typing import List, Optional, Tuple
from uuid import uuid4

from app.schemas import (
    DemoScenario,
    DemoSessionState,
    EventLogEntry,
    MarketDataStatus,
    Opportunity,
    RouteLeg,
)


SCENARIO_LABELS: dict[str, str] = {
    "none": "Live Feed",
    "profitable": "Profitable Scenario",
    "rejected": "Rejected Scenario",
    "high_slippage": "High Slippage Scenario",
    "fallback": "Hummingbot Failure Scenario",
    "high_latency": "High Latency Scenario",
}
PROVIDER_LABELS: dict[str, str] = {
    "mock": "Mock",
    "birdeye": "Birdeye",
    "coingecko": "CoinGecko",
}


class DemoStateService:
    def __init__(self) -> None:
        self._lock = Lock()
        self._active_scenario: DemoScenario = "none"
        self._replay_count = 0
        self._is_replay = False
        self._armed_at: Optional[datetime] = None
        self._event_log: List[EventLogEntry] = []
        self._dedupe_keys: set[str] = set()

    def get_session_state(self) -> DemoSessionState:
        with self._lock:
            return self._build_session_state()

    def get_event_log(self, limit: int = 24) -> List[EventLogEntry]:
        with self._lock:
            return list(self._event_log[-limit:])

    def arm_scenario(self, scenario: DemoScenario) -> DemoSessionState:
        with self._lock:
            self._active_scenario = scenario
            self._replay_count = 0
            self._is_replay = False
            self._armed_at = datetime.now(timezone.utc)
            self._event_log = []
            self._dedupe_keys = set()
            self._add_event_unlocked(
                source="demo",
                message=f"{SCENARIO_LABELS[scenario]} armed. Feed is now deterministic.",
                level="info",
            )
            if scenario == "fallback":
                self._add_event_unlocked(
                    source="execution",
                    message="Hummingbot failure scenario armed. Failover will engage on execution.",
                    level="warning",
                )
            return self._build_session_state()

    def replay(self) -> DemoSessionState:
        with self._lock:
            if self._active_scenario == "none":
                self._event_log = []
                self._dedupe_keys = set()
                self._add_event_unlocked(
                    source="demo",
                    message="Replay requested with no active scenario. Live feed remains active.",
                    level="info",
                )
                return self._build_session_state()

            self._replay_count += 1
            self._is_replay = True
            self._armed_at = datetime.now(timezone.utc)
            self._event_log = []
            self._dedupe_keys = set()
            self._add_event_unlocked(
                source="demo",
                message=f"Replay started for {SCENARIO_LABELS[self._active_scenario]}.",
                level="success",
            )
            return self._build_session_state()

    def reset(self) -> DemoSessionState:
        with self._lock:
            self._active_scenario = "none"
            self._replay_count = 0
            self._is_replay = False
            self._armed_at = None
            self._event_log = []
            self._dedupe_keys = set()
            self._add_event_unlocked(
                source="demo",
                message="Demo controls reset. Live feed resumed.",
                level="info",
            )
            return self._build_session_state()

    def record_market_data_status(self, status: MarketDataStatus) -> None:
        configured = PROVIDER_LABELS[status.configured_provider]
        actual = PROVIDER_LABELS[status.actual_provider]
        key = (
            f"market-data:{status.configured_provider}:{status.actual_provider}:"
            f"{status.connection_status}:{status.fallback_reason or 'none'}"
        )
        if status.connection_status == "fallback_to_mock":
            message = f"{configured} fallback engaged. Using mock market snapshot."
            level = "warning"
        elif status.actual_provider == "mock":
            message = "Mock market snapshot received."
            level = "info"
        else:
            message = f"{actual} snapshot received."
            level = "success"
        self.add_event(
            source="market_data",
            message=message,
            level=level,
            dedupe_key=key,
        )

    def record_opportunity(self, opportunity: Opportunity) -> None:
        key = (
            f"opportunity:{self._active_scenario}:{opportunity.id}:"
            f"{opportunity.approval_stage}:{opportunity.expected_net_profit_usd}"
        )
        message = (
            f"Opportunity detected: {opportunity.asset_symbol} {opportunity.buy_chain} to "
            f"{opportunity.sell_chain}."
        )
        self.add_event(
            source="opportunity",
            message=message,
            level="info",
            dedupe_key=f"{key}:detected",
        )
        if opportunity.execute:
            verdict = (
                f"Route approved with {opportunity.expected_net_profit_usd:.2f} USD net edge."
            )
            level = "success"
        else:
            verdict = (
                "Route rejected due to "
                f"{opportunity.approval_reason.rstrip('.').lower()}."
            )
            level = "warning"
        self.add_event(
            source="opportunity",
            message=verdict,
            level=level,
            dedupe_key=f"{key}:verdict",
        )

    def record_execution_requested(
        self, opportunity: Opportunity, execution_mode: str
    ) -> None:
        self.add_event(
            source="execution",
            message=(
                f"Execution requested for {opportunity.asset_symbol} via "
                f"{execution_mode.replace('_', ' ')}."
            ),
            level="info",
            dedupe_key=f"execution-request:{opportunity.id}:{execution_mode}",
        )

    def record_paper_trade_acknowledged(self, request_id: str) -> None:
        self.add_event(
            source="execution",
            message=f"Paper trade acknowledged for request {request_id}.",
            level="success",
            dedupe_key=f"execution-ack:{request_id}",
        )

    def record_fallback(self, request_id: str, fallback_reason: str) -> None:
        self.add_event(
            source="execution",
            message=f"{fallback_reason} Request {request_id} rerouted to mock execution.",
            level="warning",
            dedupe_key=f"execution-fallback:{request_id}:{fallback_reason}",
        )

    def record_rejection(self, opportunity: Opportunity) -> None:
        self.add_event(
            source="execution",
            message=(
                f"Route rejected before execution: {opportunity.approval_reason}"
            ),
            level="warning",
            dedupe_key=f"execution-rejected:{opportunity.id}:{opportunity.approval_reason}",
        )

    def should_force_hummingbot_failure(self) -> bool:
        with self._lock:
            return self._active_scenario == "fallback"

    def apply_to_opportunities(
        self, opportunities: List[Opportunity]
    ) -> Tuple[List[Opportunity], Optional[str]]:
        with self._lock:
            if not opportunities:
                return opportunities, None

            if self._active_scenario == "none":
                return opportunities, None

            primary = next(
                (opportunity for opportunity in opportunities if opportunity.execute),
                opportunities[0],
            )
            overridden = self._override_for_scenario(primary)
            results = [
                overridden if opportunity.id == primary.id else opportunity
                for opportunity in opportunities
            ]
        self.record_opportunity(overridden)
        return results, overridden.id

    def add_event(
        self,
        source: str,
        message: str,
        level: str = "info",
        dedupe_key: Optional[str] = None,
    ) -> None:
        with self._lock:
            if dedupe_key is not None and dedupe_key in self._dedupe_keys:
                return
            if dedupe_key is not None:
                self._dedupe_keys.add(dedupe_key)
            self._add_event_unlocked(source=source, message=message, level=level)

    def _override_for_scenario(self, opportunity: Opportunity) -> Opportunity:
        scenario = self._active_scenario
        if scenario == "profitable":
            return self._build_override(
                opportunity,
                gross_profit_usd=318.0,
                estimated_fees_usd=46.0,
                estimated_slippage_bps=7.0,
                slippage_cost_usd=16.0,
                latency_penalty_usd=9.0,
                bridge_latency_sec=82,
                confidence_score=0.94,
                execute=True,
                approval_reason=(
                    "Approved: demo scenario shows a clean net edge after fees, slippage, "
                    "and latency."
                ),
            )

        if scenario == "rejected":
            return self._build_override(
                opportunity,
                gross_profit_usd=92.0,
                estimated_fees_usd=44.0,
                estimated_slippage_bps=16.0,
                slippage_cost_usd=29.0,
                latency_penalty_usd=21.0,
                bridge_latency_sec=118,
                confidence_score=0.39,
                execute=False,
                approval_reason="Rejected: execution costs erase too much of the spread.",
            )

        if scenario == "high_slippage":
            return self._build_override(
                opportunity,
                gross_profit_usd=196.0,
                estimated_fees_usd=46.0,
                estimated_slippage_bps=46.0,
                slippage_cost_usd=135.0,
                latency_penalty_usd=15.0,
                bridge_latency_sec=96,
                confidence_score=0.48,
                execute=False,
                approval_reason="Rejected: the route is too thin for this notional size.",
            )

        if scenario == "fallback":
            return self._build_override(
                opportunity,
                gross_profit_usd=304.0,
                estimated_fees_usd=45.0,
                estimated_slippage_bps=8.0,
                slippage_cost_usd=19.0,
                latency_penalty_usd=10.0,
                bridge_latency_sec=88,
                confidence_score=0.91,
                execute=True,
                approval_reason=(
                    "Approved: route is executable, but the demo will force Hummingbot "
                    "failover."
                ),
            )

        if scenario == "high_latency":
            return self._build_override(
                opportunity,
                gross_profit_usd=214.0,
                estimated_fees_usd=45.0,
                estimated_slippage_bps=10.0,
                slippage_cost_usd=23.0,
                latency_penalty_usd=91.0,
                bridge_latency_sec=320,
                confidence_score=0.43,
                execute=False,
                approval_reason=(
                    "Rejected: bridge latency is too high to rely on the spread staying "
                    "open."
                ),
            )

        return opportunity

    def _build_override(
        self,
        opportunity: Opportunity,
        *,
        gross_profit_usd: float,
        estimated_fees_usd: float,
        estimated_slippage_bps: float,
        slippage_cost_usd: float,
        latency_penalty_usd: float,
        bridge_latency_sec: int,
        confidence_score: float,
        execute: bool,
        approval_reason: str,
    ) -> Opportunity:
        bridge_fee_usd = opportunity.cost_breakdown.bridge_fee_usd
        trading_fees_usd = round(estimated_fees_usd - bridge_fee_usd, 2)
        expected_net_profit_usd = round(
            gross_profit_usd
            - estimated_fees_usd
            - slippage_cost_usd
            - latency_penalty_usd,
            2,
        )
        route_legs = [
            leg.model_copy(
                update={
                    "expected_duration_sec": bridge_latency_sec,
                    "detail": (
                        f"Move exposure from {opportunity.buy_chain} to "
                        f"{opportunity.sell_chain} with demo-tuned bridge timing."
                    ),
                }
            )
            if leg.kind == "bridge"
            else leg
            for leg in opportunity.route_legs
        ]

        return opportunity.model_copy(
            update={
                "gross_profit_usd": gross_profit_usd,
                "gross_spread_bps": round(
                    (gross_profit_usd / max(opportunity.notional_usd, 1)) * 10_000,
                    2,
                ),
                "estimated_fees_usd": estimated_fees_usd,
                "estimated_bridge_latency_sec": bridge_latency_sec,
                "estimated_slippage_bps": estimated_slippage_bps,
                "estimated_latency_penalty_usd": latency_penalty_usd,
                "expected_net_profit_usd": expected_net_profit_usd,
                "confidence_score": confidence_score,
                "execute": execute,
                "approval_stage": "approved" if execute else "rejected",
                "approval_reason": approval_reason,
                "route_legs": route_legs,
                "cost_breakdown": opportunity.cost_breakdown.model_copy(
                    update={
                        "trading_fees_usd": trading_fees_usd,
                        "bridge_fee_usd": bridge_fee_usd,
                        "slippage_cost_usd": slippage_cost_usd,
                        "latency_penalty_usd": latency_penalty_usd,
                    }
                ),
            }
        )

    def _build_session_state(self) -> DemoSessionState:
        return DemoSessionState(
            active_scenario=self._active_scenario,
            status="idle" if self._active_scenario == "none" else "scenario_armed",
            session_label=SCENARIO_LABELS[self._active_scenario],
            replay_count=self._replay_count,
            is_replay=self._is_replay,
            armed_at=self._armed_at,
        )

    def _add_event_unlocked(
        self,
        *,
        source: str,
        message: str,
        level: str,
    ) -> None:
        self._event_log.append(
            EventLogEntry(
                id=f"log-{uuid4().hex[:10]}",
                level=level,
                source=source,
                message=message,
                timestamp=datetime.now(timezone.utc),
            )
        )
