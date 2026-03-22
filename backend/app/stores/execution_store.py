from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from uuid import uuid4

from app.schemas import ExecutionRun, Opportunity, TimelineEvent, TradeExecutionRequest


class ExecutionStore:
    def __init__(self) -> None:
        self._records: Dict[str, Dict[str, object]] = {}

    def create_run(
        self,
        opportunity: Opportunity,
        execution_mode_requested: str,
        execution_mode_used: str,
        request_preview: Optional[TradeExecutionRequest],
        fallback_reason: Optional[str] = None,
        rejection_reason: Optional[str] = None,
    ) -> ExecutionRun:
        execution_id = f"exec-{uuid4().hex[:10]}"
        started_at = datetime.now(timezone.utc)
        self._records[execution_id] = {
            "opportunity": opportunity,
            "execution_mode_requested": execution_mode_requested,
            "execution_mode_used": execution_mode_used,
            "request_preview": request_preview,
            "fallback_reason": fallback_reason,
            "rejection_reason": rejection_reason,
            "started_at": started_at,
        }
        return self.get_run(execution_id, now=started_at)

    def get_run(
        self, execution_id: str, now: Optional[datetime] = None
    ) -> Optional[ExecutionRun]:
        record = self._records.get(execution_id)
        if record is None:
            return None

        opportunity = record["opportunity"]
        started_at = record["started_at"]
        rejection_reason = record["rejection_reason"]
        fallback_reason = record["fallback_reason"]
        execution_mode_requested = record["execution_mode_requested"]
        execution_mode_used = record["execution_mode_used"]
        request_preview = record["request_preview"]
        now = now or datetime.now(timezone.utc)

        first_seen = min(opportunity.buy_quote.observed_at, opportunity.sell_quote.observed_at)
        timeline = [
            TimelineEvent(
                status="detected",
                title="Opportunity detected",
                detail=(
                    f"{opportunity.asset_symbol} spread detected between "
                    f"{opportunity.buy_venue} and {opportunity.sell_venue}."
                ),
                timestamp=first_seen,
            ),
            TimelineEvent(
                status="market_snapshot_received",
                title="Market snapshot received",
                detail=f"{opportunity.source.capitalize()} market snapshot anchored the route.",
                timestamp=first_seen + timedelta(milliseconds=250),
            ),
            TimelineEvent(
                status="feasibility_started",
                title="Feasibility simulation started",
                detail="Execution math restarted with current fees, bridge timing, and inventory size.",
                timestamp=started_at - timedelta(seconds=1.4),
            ),
            TimelineEvent(
                status="slippage_modeled",
                title="Slippage modeled",
                detail=(
                    f"Modeled slippage at {opportunity.estimated_slippage_bps:.1f} bps for "
                    f"{opportunity.asset_symbol}."
                ),
                timestamp=started_at - timedelta(seconds=1.0),
            ),
            TimelineEvent(
                status="route_scored",
                title="Route scored",
                detail=(
                    f"Confidence settled at {opportunity.confidence_score:.2f} with "
                    f"{opportunity.expected_net_profit_usd:.2f} USD expected net edge."
                ),
                timestamp=started_at - timedelta(seconds=0.6),
            ),
            TimelineEvent(
                status="decision_made",
                title="Decision made",
                detail=opportunity.approval_reason,
                timestamp=started_at - timedelta(seconds=0.2),
            ),
        ]

        if rejection_reason:
            timeline.append(
                TimelineEvent(
                    status="rejected",
                    title="Execution blocked",
                    detail=rejection_reason,
                    timestamp=started_at,
                )
            )
            return self._build_run(
                execution_id=execution_id,
                opportunity=opportunity,
                execution_mode_requested=execution_mode_requested,
                execution_mode_used=execution_mode_used,
                status="rejected",
                timeline_events=timeline,
                request_preview=request_preview,
                fallback_reason=fallback_reason,
                rejection_reason=rejection_reason,
                started_at=started_at,
                completed_at=started_at,
                terminal=True,
            )

        timeline.append(
            TimelineEvent(
                status="approved",
                title="Execution approved",
                detail="Route cleared the copilot guardrails and was queued for execution.",
                timestamp=started_at,
            )
        )

        elapsed = (now - started_at).total_seconds()
        status = "approved"
        completed_at = None
        terminal = False

        if execution_mode_used == "paper_hummingbot":
            if elapsed >= 0.75:
                timeline.append(
                    TimelineEvent(
                        status="handed_to_hummingbot",
                        title="Handed to Hummingbot",
                        detail="Paper-trade request submitted to the configured Hummingbot instance.",
                        timestamp=started_at + timedelta(seconds=0.75),
                    )
                )
                status = "handed_to_hummingbot"

            if elapsed >= 2.0:
                timeline.append(
                    TimelineEvent(
                        status="paper_trade_running",
                        title="Paper trade running",
                        detail="Hummingbot paper-trade execution is in progress.",
                        timestamp=started_at + timedelta(seconds=2.0),
                    )
                )
                status = "paper_trade_running"

            if elapsed >= 4.5:
                timeline.append(
                    TimelineEvent(
                        status="completed",
                        title="Paper trade completed",
                        detail="Hummingbot paper-trade cycle completed for the approved route.",
                        timestamp=started_at + timedelta(seconds=4.5),
                    )
                )
                status = "completed"
                completed_at = started_at + timedelta(seconds=4.5)
                terminal = True

        elif execution_mode_used == "paper_hummingbot_fallback_to_mock":
            if elapsed >= 0.75:
                timeline.append(
                    TimelineEvent(
                        status="fallback",
                        title="Fallback triggered",
                        detail=fallback_reason or "Hummingbot unavailable, used mock fallback.",
                        timestamp=started_at + timedelta(seconds=0.75),
                    )
                )
                status = "fallback"

            if elapsed >= 2.5:
                timeline.append(
                    TimelineEvent(
                        status="completed",
                        title="Fallback execution completed",
                        detail="Mock execution finished after Hummingbot failover.",
                        timestamp=started_at + timedelta(seconds=2.5),
                    )
                )
                status = "completed"
                completed_at = started_at + timedelta(seconds=2.5)
                terminal = True

        else:
            if elapsed >= 1.25:
                timeline.append(
                    TimelineEvent(
                        status="mock_execution_running",
                        title="Mock execution running",
                        detail="Demo-safe execution is running without a Hummingbot handoff.",
                        timestamp=started_at + timedelta(seconds=1.25),
                    )
                )
                status = "mock_execution_running"

            if elapsed >= 3.5:
                timeline.append(
                    TimelineEvent(
                        status="completed",
                        title="Mock execution completed",
                        detail="Mock execution completed and the request artifact was recorded.",
                        timestamp=started_at + timedelta(seconds=3.5),
                    )
                )
                status = "completed"
                completed_at = started_at + timedelta(seconds=3.5)
                terminal = True

        return self._build_run(
            execution_id=execution_id,
            opportunity=opportunity,
            execution_mode_requested=execution_mode_requested,
            execution_mode_used=execution_mode_used,
            status=status,
            timeline_events=timeline,
            request_preview=request_preview,
            fallback_reason=fallback_reason,
            rejection_reason=None,
            started_at=started_at,
            completed_at=completed_at,
            terminal=terminal,
        )

    def _build_run(
        self,
        *,
        execution_id: str,
        opportunity: Opportunity,
        execution_mode_requested: str,
        execution_mode_used: str,
        status: str,
        timeline_events,
        request_preview: Optional[TradeExecutionRequest],
        fallback_reason: Optional[str],
        rejection_reason: Optional[str],
        started_at: datetime,
        completed_at: Optional[datetime],
        terminal: bool,
    ) -> ExecutionRun:
        if execution_mode_used == "paper_hummingbot":
            executor = "Hummingbot"
            connection_status = "connected"
        elif execution_mode_used == "paper_hummingbot_fallback_to_mock":
            executor = "Mock Execution Engine"
            connection_status = "fallback_active"
        else:
            executor = "Mock Execution Engine"
            connection_status = "mock"

        request_id = request_preview.request_id if request_preview else None
        return ExecutionRun(
            id=execution_id,
            opportunity_id=opportunity.id,
            source=opportunity.source,
            execution_mode_requested=execution_mode_requested,
            execution_mode_used=execution_mode_used,
            execution_mode=execution_mode_used,
            status=status,
            execution_status=status,
            executor=executor,
            connection_status=connection_status,
            request_id=request_id,
            fallback_used=execution_mode_used == "paper_hummingbot_fallback_to_mock",
            timeline_events=timeline_events,
            request_payload_preview=request_preview,
            fallback_reason=fallback_reason,
            rejection_reason=rejection_reason,
            started_at=started_at,
            completed_at=completed_at,
            terminal=terminal,
        )
