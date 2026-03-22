from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


OpportunityStage = Literal["approved", "rejected"]
MarketDataSource = Literal["mock", "birdeye", "coingecko"]
MarketDataConnectionStatus = Literal["mock", "live", "fallback_to_mock"]
RequestedExecutionMode = Literal["mock", "paper_hummingbot"]
UsedExecutionMode = Literal[
    "mock",
    "paper_hummingbot",
    "paper_hummingbot_fallback_to_mock",
]
HummingbotConnectionState = Literal["connected", "unavailable", "fallback_active"]
ExecutionStatus = Literal[
    "detected",
    "market_snapshot_received",
    "feasibility_started",
    "slippage_modeled",
    "route_scored",
    "decision_made",
    "simulated",
    "approved",
    "handed_to_hummingbot",
    "paper_trade_running",
    "mock_execution_running",
    "fallback",
    "completed",
    "rejected",
]
EventLogLevel = Literal["info", "success", "warning"]
EventLogSource = Literal["system", "market_data", "demo", "opportunity", "execution"]
DemoScenario = Literal[
    "none",
    "profitable",
    "rejected",
    "high_slippage",
    "fallback",
    "high_latency",
]
DemoSessionStatus = Literal["idle", "scenario_armed"]


class EventLogEntry(BaseModel):
    id: str
    level: EventLogLevel
    source: EventLogSource
    message: str
    timestamp: datetime


class MarketDataStatus(BaseModel):
    configured_provider: MarketDataSource
    actual_provider: MarketDataSource
    connection_status: MarketDataConnectionStatus
    label: str
    message: str
    fallback_reason: Optional[str] = None


class DemoSessionState(BaseModel):
    active_scenario: DemoScenario
    status: DemoSessionStatus
    session_label: str
    replay_count: int
    is_replay: bool
    armed_at: Optional[datetime] = None


class MarketQuote(BaseModel):
    quote_id: str
    asset_symbol: str
    chain: str
    venue: str
    pair: str
    price_usd: float
    fee_bps: float
    available_liquidity_usd: float
    depth_score: float
    freshness_seconds: int
    observed_at: datetime


class CostBreakdown(BaseModel):
    trading_fees_usd: float
    bridge_fee_usd: float
    slippage_cost_usd: float
    latency_penalty_usd: float = 0.0


class RouteLeg(BaseModel):
    kind: Literal["buy", "bridge", "sell"]
    label: str
    chain: str
    venue: Optional[str] = None
    expected_duration_sec: int
    detail: str


class MonteCarloResult(BaseModel):
    num_simulations: int
    expected_profit_usd: float
    probability_of_profit: float
    p10_usd: float
    p50_usd: float
    p90_usd: float
    best_case_usd: float
    worst_case_usd: float
    std_dev_usd: float
    sharpe_approx: float
    recommendation: str
    risk_label: str


class IntentRequest(BaseModel):
    intent: str


class IntentResponse(BaseModel):
    parsed_intent: str
    intent_type: str
    asset_from: Optional[str] = None
    asset_to: Optional[str] = None
    amount_usd: Optional[float] = None
    chain_from: Optional[str] = None
    chain_to: Optional[str] = None
    opportunities: List["Opportunity"]
    total: int
    as_of: datetime


class Opportunity(BaseModel):
    id: str
    source: MarketDataSource
    asset_symbol: str
    buy_chain: str
    buy_venue: str
    sell_chain: str
    sell_venue: str
    bridge_name: str
    bridge_pair: str
    notional_usd: float
    asset_amount: float
    gross_spread_bps: float
    gross_profit_usd: float
    estimated_fees_usd: float
    estimated_bridge_latency_sec: int
    estimated_slippage_bps: float
    estimated_latency_penalty_usd: float = 0.0
    expected_net_profit_usd: float
    confidence_score: float = Field(ge=0.0, le=1.0)
    execute: bool
    approval_stage: OpportunityStage
    approval_reason: str
    route_legs: List[RouteLeg]
    cost_breakdown: CostBreakdown
    buy_quote: MarketQuote
    sell_quote: MarketQuote
    monte_carlo: Optional[MonteCarloResult] = None


class HummingbotStatus(BaseModel):
    enabled: bool
    state: HummingbotConnectionState
    message: str
    api_url: str
    instance_name: str
    paper_trade: bool


class OpportunityListResponse(BaseModel):
    as_of: datetime
    source: MarketDataSource
    execution_mode: RequestedExecutionMode
    total: int
    opportunities: List[Opportunity]
    hummingbot_status: HummingbotStatus
    market_data_status: MarketDataStatus
    demo_session: DemoSessionState
    event_log: List[EventLogEntry]


class HealthResponse(BaseModel):
    status: str
    execution_mode: RequestedExecutionMode
    market_data_provider: str
    hummingbot_status: HummingbotStatus
    market_data_status: MarketDataStatus
    demo_session: DemoSessionState
    event_log: List[EventLogEntry]
    as_of: datetime


class TradeGuardrails(BaseModel):
    max_slippage_bps: float
    min_net_profit_usd: float
    min_confidence_score: float


class TradeExecutionRequest(BaseModel):
    request_id: str
    opportunity_id: str
    asset_symbol: str
    symbol: str
    side: str
    source_chain: str
    source_venue: str
    destination_chain: str
    destination_venue: str
    bridge_name: str
    bridge_pair: str
    notional_usd: float
    asset_amount: float
    execution_mode_requested: RequestedExecutionMode
    paper_trade: bool
    paper_trade_connector: str
    submission_target: str
    external_execution_id: Optional[str] = None
    artifact_path: Optional[str] = None
    approval_stage: OpportunityStage
    guardrails: TradeGuardrails


class TimelineEvent(BaseModel):
    status: ExecutionStatus
    title: str
    detail: str
    timestamp: datetime


class ExecutionRun(BaseModel):
    id: str
    opportunity_id: str
    source: MarketDataSource
    execution_mode_requested: RequestedExecutionMode
    execution_mode_used: UsedExecutionMode
    execution_mode: UsedExecutionMode
    status: ExecutionStatus
    execution_status: ExecutionStatus
    executor: str
    connection_status: str
    request_id: Optional[str] = None
    fallback_used: bool
    timeline_events: List[TimelineEvent]
    request_payload_preview: Optional[TradeExecutionRequest]
    fallback_reason: Optional[str] = None
    rejection_reason: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    terminal: bool
    market_data_status: Optional[MarketDataStatus] = None
    demo_session: Optional[DemoSessionState] = None
    event_log: List[EventLogEntry] = Field(default_factory=list)


# Resolve forward references
IntentResponse.model_rebuild()
