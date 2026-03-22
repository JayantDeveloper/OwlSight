from __future__ import annotations

import json
from pathlib import Path
from uuid import uuid4

from fastapi.encoders import jsonable_encoder

from app.core.config import Settings
from app.schemas import HummingbotStatus, Opportunity, TradeExecutionRequest, TradeGuardrails
from app.services.demo_state_service import DemoStateService
from app.services.hummingbot_client import HummingbotClient
from app.stores.execution_store import ExecutionStore


class HummingbotAdapter:
    def __init__(
        self,
        settings: Settings,
        execution_store: ExecutionStore,
        hummingbot_client: HummingbotClient,
        demo_state_service: DemoStateService,
    ) -> None:
        self._settings = settings
        self._execution_store = execution_store
        self._hummingbot_client = hummingbot_client
        self._demo_state_service = demo_state_service
        self._settings.request_dir.mkdir(parents=True, exist_ok=True)

    def get_status(self) -> HummingbotStatus:
        return self._hummingbot_client.get_status()

    def submit_opportunity(self, opportunity: Opportunity):
        execution_mode_requested = self._settings.execution_mode
        request_preview = self._build_request(opportunity)
        self._demo_state_service.record_execution_requested(
            opportunity, execution_mode_requested
        )

        if not opportunity.execute:
            artifact_path = self._write_artifact(
                request_preview=request_preview,
                execution_mode_used=execution_mode_requested,
                note="Opportunity rejected before any execution handoff.",
            )
            request_preview = request_preview.model_copy(
                update={"artifact_path": str(artifact_path)}
            )
            self._demo_state_service.record_rejection(opportunity)
            return self._execution_store.create_run(
                opportunity=opportunity,
                execution_mode_requested=execution_mode_requested,
                execution_mode_used=execution_mode_requested,
                request_preview=request_preview,
                rejection_reason=opportunity.approval_reason,
            )

        if execution_mode_requested == "mock":
            return self._run_mock_execution(opportunity, request_preview)

        return self._run_paper_hummingbot_execution(opportunity, request_preview)

    def _run_mock_execution(
        self, opportunity: Opportunity, request_preview: TradeExecutionRequest
    ):
        artifact_path = self._write_artifact(
            request_preview=request_preview,
            execution_mode_used="mock",
            note="Mock execution selected explicitly.",
        )
        request_preview = request_preview.model_copy(
            update={
                "artifact_path": str(artifact_path),
                "submission_target": "mock-execution-engine",
            }
        )
        return self._execution_store.create_run(
            opportunity=opportunity,
            execution_mode_requested="mock",
            execution_mode_used="mock",
            request_preview=request_preview,
        )

    def _run_paper_hummingbot_execution(
        self, opportunity: Opportunity, request_preview: TradeExecutionRequest
    ):
        if self._demo_state_service.should_force_hummingbot_failure():
            fallback_reason = "Hummingbot unavailable, failover engaged by demo scenario."
            artifact_path = self._write_artifact(
                request_preview=request_preview,
                execution_mode_used="paper_hummingbot_fallback_to_mock",
                note=fallback_reason,
                dispatch_payload={"forced_by_demo": True},
            )
            request_preview = request_preview.model_copy(
                update={
                    "artifact_path": str(artifact_path),
                    "submission_target": "mock-execution-engine",
                }
            )
            self._demo_state_service.record_fallback(
                request_preview.request_id,
                fallback_reason,
            )
            return self._execution_store.create_run(
                opportunity=opportunity,
                execution_mode_requested="paper_hummingbot",
                execution_mode_used="paper_hummingbot_fallback_to_mock",
                request_preview=request_preview,
                fallback_reason=fallback_reason,
            )

        submission = self._hummingbot_client.submit_paper_trade_execution(request_preview)

        if submission.accepted:
            artifact_path = self._write_artifact(
                request_preview=request_preview,
                execution_mode_used="paper_hummingbot",
                note="Submitted to Hummingbot paper-trade path.",
                dispatch_payload=submission.response_payload,
            )
            request_preview = request_preview.model_copy(
                update={
                    "artifact_path": str(artifact_path),
                    "submission_target": submission.submission_target,
                    "external_execution_id": submission.remote_execution_id,
                }
            )
            self._demo_state_service.record_paper_trade_acknowledged(
                request_preview.request_id
            )
            return self._execution_store.create_run(
                opportunity=opportunity,
                execution_mode_requested="paper_hummingbot",
                execution_mode_used="paper_hummingbot",
                request_preview=request_preview,
            )

        artifact_path = self._write_artifact(
            request_preview=request_preview,
            execution_mode_used="paper_hummingbot_fallback_to_mock",
            note=submission.fallback_reason or "Hummingbot unavailable, used mock fallback.",
            dispatch_payload=submission.response_payload,
        )
        request_preview = request_preview.model_copy(
            update={
                "artifact_path": str(artifact_path),
                "submission_target": "mock-execution-engine",
            }
        )
        self._demo_state_service.record_fallback(
            request_preview.request_id,
            submission.fallback_reason or "Hummingbot unavailable, used mock fallback.",
        )
        return self._execution_store.create_run(
            opportunity=opportunity,
            execution_mode_requested="paper_hummingbot",
            execution_mode_used="paper_hummingbot_fallback_to_mock",
            request_preview=request_preview,
            fallback_reason=submission.fallback_reason
            or "Hummingbot unavailable, used mock fallback.",
        )

    def _build_request(self, opportunity: Opportunity) -> TradeExecutionRequest:
        paper_trade_connector, symbol = self._hummingbot_client.paper_trade_market(
            opportunity.asset_symbol
        )
        return TradeExecutionRequest(
            request_id=f"hbreq-{uuid4().hex[:10]}",
            opportunity_id=opportunity.id,
            asset_symbol=opportunity.asset_symbol,
            symbol=symbol,
            side="buy_then_bridge_then_sell",
            source_chain=opportunity.buy_chain,
            source_venue=opportunity.buy_venue,
            destination_chain=opportunity.sell_chain,
            destination_venue=opportunity.sell_venue,
            bridge_name=opportunity.bridge_name,
            bridge_pair=opportunity.bridge_pair,
            notional_usd=opportunity.notional_usd,
            asset_amount=opportunity.asset_amount,
            execution_mode_requested=self._settings.execution_mode,
            paper_trade=self._settings.hummingbot_paper_trade,
            paper_trade_connector=paper_trade_connector,
            submission_target=f"hummingbot:{self._settings.hummingbot_instance_name}",
            approval_stage=opportunity.approval_stage,
            guardrails=TradeGuardrails(
                max_slippage_bps=opportunity.estimated_slippage_bps + 4,
                min_net_profit_usd=self._settings.opportunity_min_net_profit_usd,
                min_confidence_score=self._settings.confidence_threshold,
            ),
        )

    def _write_artifact(
        self,
        request_preview: TradeExecutionRequest,
        execution_mode_used: str,
        note: str,
        dispatch_payload: dict | None = None,
    ) -> Path:
        artifact_path = self._settings.request_dir / f"{request_preview.request_id}.json"
        artifact = {
            "execution_mode_requested": request_preview.execution_mode_requested,
            "execution_mode_used": execution_mode_used,
            "note": note,
            "request": jsonable_encoder(request_preview),
            "dispatch_payload": dispatch_payload,
        }
        artifact_path.write_text(json.dumps(artifact, indent=2))
        return artifact_path
