# OwlSight

OwlSight is a demo-first intelligence layer on top of Hummingbot. It watches cross-chain price dislocations, simulates whether they are actually executable after trading fees, bridge latency, slippage, and infrastructure risk, and only then hands approved trades to Hummingbot as the execution engine.

The goal of this version is to be impressive in a hackathon setting while staying clean, local, and easy to extend.

## What It Does

- Ingests stable mock snapshots plus live-anchored provider data from Birdeye or CoinGecko.
- Detects cross-chain spread opportunities for `SOL`, `ETH`, and `WBTC`.
- Computes gross edge, trading fees, bridge fee, bridge latency, slippage, latency penalty, expected net profit, and a confidence score.
- Gates execution with explicit `execute = true/false` logic.
- Lets the frontend trigger an execution handoff to Hummingbot through a dedicated adapter.
- Adds deterministic demo controls, a terminal-style event log, and richer execution reasoning for live demos.

## Architecture

```text
                    +--------------------------------------+
                    |           Next.js Frontend           |
                    | dashboard / route inspector / timeline|
                    +-------------------+------------------+
                                        |
                                        | REST
                                        v
                    +--------------------------------------+
                    |           FastAPI Backend            |
                    |--------------------------------------|
                    | market_data_service                  |
                    | opportunity_engine                   |
                    | feasibility_engine                   |
                    | hummingbot_adapter                   |
                    | execution_store                      |
                    +-------------------+------------------+
                                        |
                     approved opportunities only
                                        |
                                        v
                    +--------------------------------------+
                    |     Hummingbot Adapter Layer         |
                    | mock paper flow + real request shape |
                    +-------------------+------------------+
                                        |
                          request artifact / future trigger
                                        |
                                        v
                    +--------------------------------------+
                    |            Hummingbot                |
                    | container / CLI / strategy runtime   |
                    +--------------------------------------+
```

## Repo Layout

- `frontend/`: Next.js + TypeScript + Tailwind dashboard.
- `backend/`: FastAPI API, opportunity analysis, and execution orchestration.
- `hummingbot/`: request payload examples and integration notes.
- `docs/`: demo script and architecture notes.

## Hummingbot's Role

Hummingbot is not treated as the strategy brain. The backend is the intelligence layer that decides whether a route is executable. Only approved opportunities are translated into a `TradeExecutionRequest` and handed off through `hummingbot_adapter.py`.

Execution modes:

- `EXECUTION_MODE=paper_hummingbot`: primary non-mock mode. The backend tries to submit a paper-trade request through the configured Hummingbot control surface.
- `EXECUTION_MODE=mock`: fully local fallback mode with no Hummingbot dependency.

If Hummingbot is unavailable while `paper_hummingbot` is requested, or if the fallback demo scenario is armed, the backend falls back gracefully to mock execution and reports the fallback explicitly in API responses and the UI.

## Setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Paste your CoinGecko API key into `backend/.env`. Birdeye remains optional.
3. Copy `frontend/.env.local.example` to `frontend/.env.local`.

All market-data API keys are backend-only. They are never exposed to the frontend.

## Run Locally

### Backend

```bash
cd backend
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend API will be available at `http://localhost:8000`.

To force a fully local demo without Hummingbot, set `EXECUTION_MODE=mock` in `backend/.env`.
To force a fully local feed, set `MARKET_DATA_PROVIDER=mock`.

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`.

### Hummingbot

The backend expects a Hummingbot control surface at `HUMMINGBOT_API_URL`, which defaults to `http://localhost:15888`. If it is reachable and accepts the paper-trade submission flow, the dashboard will show `PAPER TRADE`. If not, execution stays demo-safe and falls back to mock mode with a visible warning state.

This project keeps the uncertain API details isolated in `backend/app/services/hummingbot_client.py`, so connecting a real instance later does not require rewiring the rest of the backend.

### Market Data Providers

- `MARKET_DATA_PROVIDER=coingecko`: uses CoinGecko live prices as anchor points for the stable demo market snapshot.
- `MARKET_DATA_PROVIDER=birdeye`: uses Birdeye live prices as anchor points for the stable demo market snapshot.
- `MARKET_DATA_PROVIDER=mock`: uses the deterministic local feed only.

If a live provider fails or rate-limits, the backend falls back to mock data and surfaces the reason in the UI.

## Useful Commands

```bash
make backend-venv
make backend-install
make backend-dev
make backend-test
make frontend-install
make frontend-dev
```

## Demo Flow

1. Open the dashboard and point to the hero message: “We simulate execution before we trade.”
2. Use the demo controls to arm a deterministic scenario such as `Profitable` or `High Slippage`.
3. Click the staged route and walk through the verdict card, lifecycle pipeline, and equation-style PnL breakdown.
4. Trigger execution and narrate the more cinematic timeline stages from market snapshot through route scoring to Hummingbot handoff or failover.
5. Use the terminal-style event log to explain live provider status, rejection reasons, and paper-trade acknowledgements.

## Documentation

- [Architecture Notes](docs/ARCHITECTURE.md)
- [Judge Demo Script](docs/DEMO.md)
# OwlSight
