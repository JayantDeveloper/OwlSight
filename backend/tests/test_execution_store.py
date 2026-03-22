from datetime import datetime, timedelta, timezone

from app.schemas import (
    CostBreakdown,
    MarketQuote,
    Opportunity,
    RouteLeg,
    TradeExecutionRequest,
    TradeGuardrails,
)
from app.stores.execution_store import ExecutionStore


def _build_opportunity(execute: bool) -> Opportunity:
    observed_at = datetime(2026, 3, 21, 16, 0, tzinfo=timezone.utc)
    quote = MarketQuote(
        quote_id="q-1",
        asset_symbol="SOL",
        chain="Solana",
        venue="Jupiter",
        pair="SOL/USDC",
        price_usd=180.0,
        fee_bps=8,
        available_liquidity_usd=1_000_000,
        depth_score=0.9,
        freshness_seconds=6,
        observed_at=observed_at,
    )
    sell_quote = quote.model_copy(
        update={
            "quote_id": "q-2",
            "chain": "Base",
            "venue": "Aerodrome",
            "price_usd": 182.5,
        }
    )
    return Opportunity(
        id="sol-solana-jupiter-base-aerodrome",
        source="mock",
        asset_symbol="SOL",
        buy_chain="Solana",
        buy_venue="Jupiter",
        sell_chain="Base",
        sell_venue="Aerodrome",
        bridge_name="Wormhole",
        bridge_pair="Solana->Base",
        notional_usd=18_000,
        asset_amount=100.0,
        gross_spread_bps=138.0,
        gross_profit_usd=250.0,
        estimated_fees_usd=42.0,
        estimated_bridge_latency_sec=95,
        estimated_slippage_bps=9.0,
        expected_net_profit_usd=165.0 if execute else 20.0,
        confidence_score=0.82 if execute else 0.41,
        execute=execute,
        approval_stage="approved" if execute else "rejected",
        approval_reason=(
            "Approved: net edge survives fees and slippage."
            if execute
            else "Rejected: execution costs erase too much of the spread."
        ),
        route_legs=[
            RouteLeg(
                kind="buy",
                label="Acquire SOL on Jupiter",
                chain="Solana",
                venue="Jupiter",
                expected_duration_sec=15,
                detail="Buy leg",
            )
        ],
        cost_breakdown=CostBreakdown(
            trading_fees_usd=30.0,
            bridge_fee_usd=12.0,
            slippage_cost_usd=16.0,
        ),
        buy_quote=quote,
        sell_quote=sell_quote,
    )


def _build_request() -> TradeExecutionRequest:
    return TradeExecutionRequest(
        request_id="hbreq-123",
        opportunity_id="sol-solana-jupiter-base-aerodrome",
        asset_symbol="SOL",
        symbol="SOL-USDT",
        side="buy_then_bridge_then_sell",
        source_chain="Solana",
        source_venue="Jupiter",
        destination_chain="Base",
        destination_venue="Aerodrome",
        bridge_name="Wormhole",
        bridge_pair="Solana->Base",
        notional_usd=18_000,
        asset_amount=100.0,
        execution_mode_requested="paper_hummingbot",
        paper_trade=True,
        paper_trade_connector="binance_paper_trade",
        submission_target="hummingbot:paper-demo",
        approval_stage="approved",
        guardrails=TradeGuardrails(
            max_slippage_bps=13.0,
            min_net_profit_usd=75.0,
            min_confidence_score=0.68,
        ),
    )


def test_execution_progression_for_paper_hummingbot_run():
    store = ExecutionStore()
    created = store.create_run(
        opportunity=_build_opportunity(execute=True),
        execution_mode_requested="paper_hummingbot",
        execution_mode_used="paper_hummingbot",
        request_preview=_build_request(),
    )

    started = created.started_at
    mid_run = store.get_run(created.id, now=started + timedelta(seconds=1))
    running = store.get_run(created.id, now=started + timedelta(seconds=3))
    finished = store.get_run(created.id, now=started + timedelta(seconds=5))

    assert mid_run is not None
    assert mid_run.status == "handed_to_hummingbot"
    assert running is not None
    assert running.status == "paper_trade_running"
    assert finished is not None
    assert finished.status == "completed"
    assert finished.terminal is True


def test_execution_progression_for_fallback_run():
    store = ExecutionStore()
    created = store.create_run(
        opportunity=_build_opportunity(execute=True),
        execution_mode_requested="paper_hummingbot",
        execution_mode_used="paper_hummingbot_fallback_to_mock",
        request_preview=_build_request(),
        fallback_reason="Hummingbot unavailable, used mock fallback.",
    )

    started = created.started_at
    fallback = store.get_run(created.id, now=started + timedelta(seconds=1))
    finished = store.get_run(created.id, now=started + timedelta(seconds=3))

    assert fallback is not None
    assert fallback.status == "fallback"
    assert fallback.fallback_reason == "Hummingbot unavailable, used mock fallback."
    assert finished is not None
    assert finished.status == "completed"
    assert finished.terminal is True


def test_execution_rejects_immediately_for_blocked_route():
    store = ExecutionStore()
    created = store.create_run(
        opportunity=_build_opportunity(execute=False),
        execution_mode_requested="paper_hummingbot",
        execution_mode_used="paper_hummingbot",
        request_preview=_build_request().model_copy(update={"approval_stage": "rejected"}),
        rejection_reason="Rejected: execution costs erase too much of the spread.",
    )

    assert created.status == "rejected"
    assert created.terminal is True
    assert created.rejection_reason is not None
