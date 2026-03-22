export type OpportunityStage = "approved" | "rejected";
export type MarketDataSource = "mock" | "birdeye" | "coingecko";
export type MarketDataConnectionStatus = "mock" | "live" | "fallback_to_mock";
export type RequestedExecutionMode = "mock" | "paper_hummingbot";
export type UsedExecutionMode =
  | "mock"
  | "paper_hummingbot"
  | "paper_hummingbot_fallback_to_mock";
export type HummingbotConnectionState =
  | "connected"
  | "unavailable"
  | "fallback_active";
export type DemoScenario =
  | "none"
  | "profitable"
  | "rejected"
  | "high_slippage"
  | "fallback"
  | "high_latency";

export type ExecutionStatus =
  | "detected"
  | "market_snapshot_received"
  | "feasibility_started"
  | "slippage_modeled"
  | "route_scored"
  | "decision_made"
  | "simulated"
  | "approved"
  | "handed_to_hummingbot"
  | "paper_trade_running"
  | "mock_execution_running"
  | "fallback"
  | "completed"
  | "rejected";

export interface EventLogEntry {
  id: string;
  level: "info" | "success" | "warning";
  source: "system" | "market_data" | "demo" | "opportunity" | "execution";
  message: string;
  timestamp: string;
}

export interface MarketDataStatus {
  configured_provider: MarketDataSource;
  actual_provider: MarketDataSource;
  connection_status: MarketDataConnectionStatus;
  label: string;
  message: string;
  fallback_reason?: string | null;
}

export interface DemoSessionState {
  active_scenario: DemoScenario;
  status: "idle" | "scenario_armed";
  session_label: string;
  replay_count: number;
  is_replay: boolean;
  armed_at?: string | null;
}

export interface MarketQuote {
  quote_id: string;
  asset_symbol: string;
  chain: string;
  venue: string;
  pair: string;
  price_usd: number;
  fee_bps: number;
  available_liquidity_usd: number;
  depth_score: number;
  freshness_seconds: number;
  observed_at: string;
}

export interface CostBreakdown {
  trading_fees_usd: number;
  bridge_fee_usd: number;
  slippage_cost_usd: number;
  latency_penalty_usd: number;
}

export interface RouteLeg {
  kind: "buy" | "bridge" | "sell";
  label: string;
  chain: string;
  venue?: string | null;
  expected_duration_sec: number;
  detail: string;
}

export interface MonteCarloResult {
  num_simulations: number;
  expected_profit_usd: number;
  probability_of_profit: number;
  p10_usd: number;
  p50_usd: number;
  p90_usd: number;
  best_case_usd: number;
  worst_case_usd: number;
  std_dev_usd: number;
  sharpe_approx: number;
  recommendation: string;
  risk_label: string;
}

export interface IntentResponse {
  parsed_intent: string;
  intent_type: string;
  asset_from?: string | null;
  asset_to?: string | null;
  amount_usd?: number | null;
  chain_from?: string | null;
  chain_to?: string | null;
  opportunities: Opportunity[];
  total: number;
  as_of: string;
}

export interface Opportunity {
  id: string;
  source: MarketDataSource;
  asset_symbol: string;
  buy_chain: string;
  buy_venue: string;
  sell_chain: string;
  sell_venue: string;
  bridge_name: string;
  bridge_pair: string;
  notional_usd: number;
  asset_amount: number;
  gross_spread_bps: number;
  gross_profit_usd: number;
  estimated_fees_usd: number;
  estimated_bridge_latency_sec: number;
  estimated_slippage_bps: number;
  estimated_latency_penalty_usd: number;
  expected_net_profit_usd: number;
  confidence_score: number;
  execute: boolean;
  approval_stage: OpportunityStage;
  approval_reason: string;
  route_legs: RouteLeg[];
  cost_breakdown: CostBreakdown;
  buy_quote: MarketQuote;
  sell_quote: MarketQuote;
  monte_carlo?: MonteCarloResult | null;
}

export interface HummingbotStatus {
  enabled: boolean;
  state: HummingbotConnectionState;
  message: string;
  api_url: string;
  instance_name: string;
  paper_trade: boolean;
}

export interface OpportunityListResponse {
  as_of: string;
  source: MarketDataSource;
  execution_mode: RequestedExecutionMode;
  total: number;
  opportunities: Opportunity[];
  hummingbot_status: HummingbotStatus;
  market_data_status: MarketDataStatus;
  demo_session: DemoSessionState;
  event_log: EventLogEntry[];
}

export interface TradeGuardrails {
  max_slippage_bps: number;
  min_net_profit_usd: number;
  min_confidence_score: number;
}

export interface TradeExecutionRequest {
  request_id: string;
  opportunity_id: string;
  asset_symbol: string;
  symbol: string;
  side: string;
  source_chain: string;
  source_venue: string;
  destination_chain: string;
  destination_venue: string;
  bridge_name: string;
  bridge_pair: string;
  notional_usd: number;
  asset_amount: number;
  execution_mode_requested: RequestedExecutionMode;
  paper_trade: boolean;
  paper_trade_connector: string;
  submission_target: string;
  external_execution_id?: string | null;
  artifact_path?: string | null;
  approval_stage: OpportunityStage;
  guardrails: TradeGuardrails;
}

export interface TimelineEvent {
  status: ExecutionStatus;
  title: string;
  detail: string;
  timestamp: string;
}

export interface ExecutionRun {
  id: string;
  opportunity_id: string;
  source: MarketDataSource;
  execution_mode_requested: RequestedExecutionMode;
  execution_mode_used: UsedExecutionMode;
  execution_mode: UsedExecutionMode;
  status: ExecutionStatus;
  execution_status: ExecutionStatus;
  executor: string;
  connection_status: string;
  request_id?: string | null;
  fallback_used: boolean;
  timeline_events: TimelineEvent[];
  request_payload_preview?: TradeExecutionRequest | null;
  fallback_reason?: string | null;
  rejection_reason?: string | null;
  started_at: string;
  completed_at?: string | null;
  terminal: boolean;
  market_data_status?: MarketDataStatus | null;
  demo_session?: DemoSessionState | null;
  event_log: EventLogEntry[];
}
