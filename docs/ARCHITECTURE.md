# Architecture Notes

## Product Shape

OwlSight is an intelligence layer in front of Hummingbot. It does not blindly execute spreads. It:

1. ingests market snapshots across multiple chains and venues
2. detects price dislocations
3. models execution feasibility after fees, bridge latency, and slippage
4. only then hands approved routes to Hummingbot

## Services

### Frontend

- Next.js App Router dashboard for judges and operators.
- Polls the backend every 5 seconds for opportunities.
- Includes deterministic demo controls for staging profitable, rejected, high-slippage, high-latency, and failover scenarios.
- Lets an operator inspect the route legs, cost stack, expected net PnL, and confidence.
- Triggers execution via `POST /api/opportunities/{id}/execute`.
- Polls execution status every 1 second until the run is terminal.
- Shows provider badges, execution-mode badges, Hummingbot connectivity, fallback state, session state, and a terminal-like event log.

### `market_data_service.py`

- Loads seeded cross-chain quotes from `backend/data/mock_markets.json`.
- Adds deterministic jitter and freshness timestamps so the feed feels live without introducing random demo behavior.
- Supports `mock`, `birdeye`, and `coingecko` providers.
- Uses Birdeye or CoinGecko as live anchor prices on top of the stable demo quote matrix.
- Returns provider status, actual provider used, and fallback reason if a live provider drops to mock.
- Provides asset profiles such as default notional and slippage guardrails.

### `demo_state_service.py`

- Keeps the active demo scenario in memory.
- Arms deterministic scenario overrides without rewriting the opportunity engine.
- Supports replay and reset.
- Produces terminal-style event log entries for provider, opportunity, demo, and execution events.

### `opportunity_engine.py`

- Normalizes quotes by asset.
- Compares buy and sell legs across different chains.
- Builds route candidates only when the sell venue is priced above the buy venue.
- Computes gross spread and gross profit before feasibility costs are applied.

### `feasibility_engine.py`

- Adds trading fees, bridge fee, bridge latency, slippage, and a latency penalty estimate.
- Produces `expected_net_profit_usd` and a `confidence_score`.
- Applies execution guardrails so only routes with sufficient edge and acceptable risk are marked `execute = true`.

### `hummingbot_adapter.py`

- Receives an opportunity after the operator hits execute.
- Converts it into a `TradeExecutionRequest`.
- In `mock` mode, writes a request artifact into `hummingbot/requests/` and simulates a mock execution lifecycle.
- In `paper_hummingbot` mode, tries to submit a paper-trade request through the Hummingbot client abstraction.
- If the configured Hummingbot surface is unreachable or incompatible, falls back to mock execution and records the fallback reason.

### `hummingbot_client.py`

- Isolates all Hummingbot control-surface assumptions in one place.
- Checks whether the configured Hummingbot URL is reachable.
- Formats a paper-trade submission payload for the configured instance name.
- Tries a small set of realistic bot-start endpoint shapes.
- Supports optional status polling without leaking those assumptions into the rest of the backend.

### `execution_store.py`

- Keeps execution runs in memory for the local demo.
- Derives timeline progression from elapsed time rather than requiring background jobs.
- Emits a more detailed execution-control sequence, from market snapshot intake through route scoring and final execution/failover.
- Supports both approved runs and immediate rejections for blocked routes.

## API Contract

- `GET /api/health`
- `GET /api/opportunities`
- `GET /api/opportunities/{opportunity_id}`
- `POST /api/opportunities/{opportunity_id}/execute`
- `GET /api/executions/{execution_id}`
- `POST /api/demo/scenario/profitable`
- `POST /api/demo/scenario/rejected`
- `POST /api/demo/scenario/high-slippage`
- `POST /api/demo/scenario/fallback`
- `POST /api/demo/scenario/high-latency`
- `POST /api/demo/replay`
- `POST /api/demo/reset`

## Data and State

- Market snapshots are mocked in JSON.
- Live provider prices are used only as anchors for demo stability.
- Execution history is in-memory for this version.
- Hummingbot request payloads are written as JSON artifacts for review and future integration.
- Birdeye and CoinGecko data remain backend-only.

## Why This Is Hackathon-Friendly

- No external exchange keys are required.
- No Redis or background worker is required.
- The Hummingbot role is explicit and visible in the architecture.
- The system is easy to demo locally and easy to replace with real integrations later.
- If Hummingbot is down, the UI still completes the demo via explicit mock fallback.
