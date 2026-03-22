# Hummingbot Integration

## Hummingbot's Role in This System

Hummingbot is the execution engine, not the opportunity brain.

OwlSight performs:

1. market data ingestion
2. opportunity detection
3. feasibility scoring
4. execution approval

Only after those steps does the backend hand the route to the Hummingbot adapter.

## Current Modes

### `EXECUTION_MODE=mock`

- Produces a `TradeExecutionRequest`.
- Writes a request artifact into `hummingbot/requests/`.
- Simulates a mock execution lifecycle so the frontend can show a reliable demo even with no Hummingbot service running.

### `EXECUTION_MODE=paper_hummingbot`

- Produces the exact same request payload shape.
- Attempts a paper-trade submission through the configured Hummingbot control surface.
- Uses `HUMMINGBOT_API_URL`, `HUMMINGBOT_INSTANCE_NAME`, and `HUMMINGBOT_PAPER_TRADE` from `backend/.env`.
- Falls back to mock execution if Hummingbot is unavailable or does not accept the submission flow.

## Request Shape

The adapter emits a request containing:

- opportunity id
- asset symbol
- source and destination chain
- source and destination venue
- bridge name and bridge pair
- notional and asset amount
- execution mode
- guardrails for slippage, minimum net profit, and minimum confidence

See `sample_execution_request.json` for the expected structure.

## Local Setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Paste your Birdeye API key into `backend/.env`.
3. Leave `EXECUTION_MODE=paper_hummingbot` if you want the adapter to try Hummingbot first.
4. Switch to `EXECUTION_MODE=mock` if you want a purely local demo with no Hummingbot dependency.

## How to Swap the Mock for Real Hummingbot

Inside `backend/app/services/hummingbot_client.py`, replace or tighten the assumed endpoint candidates with the exact control API exposed by your Hummingbot deployment.

Good next steps:

1. Point `HUMMINGBOT_API_URL` at the actual paper-trade control service you want to use.
2. Replace the candidate bot-start endpoints with the verified one from that deployment.
3. Swap the generic paper-trade connector assumption with the exact connector or script you want Hummingbot to run.
4. If needed, add authenticated requests inside `hummingbot_client.py` only.

The important contract is already in place: `TradeExecutionRequest` is the handoff boundary, and the fallback path keeps the demo stable if Hummingbot is unavailable.
