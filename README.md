# OWLSight

**OWLSight puts institutional-grade trade intelligence in your hands — simulating thousands of execution paths before committing a single dollar to the chain.**

OWLSight is an AI-powered cross-chain execution copilot built on top of Hummingbot. It watches for price dislocations across chains, runs Monte Carlo simulation to model real execution outcomes, and only hands approved routes to Hummingbot — with a full dashboard, execution history, and simulation library for every trade decision.

---

## What It Does

- **Natural language intent** — describe a trade in plain English ("Swap 2 ETH to SOL, best execution"), powered by the Anthropic Claude API
- **Live market data** — real-time prices from CoinGecko and Birdeye across Solana, Base, Ethereum, and Arbitrum
- **Monte Carlo simulation** — thousands of simulated execution runs per route, sampling real distributions of slippage, gas variance, and bridge timing
- **Route Intelligence Matrix** — every candidate route ranked by confidence score, net P&L, fees, slippage, and latency with multiple visualization modes (Whisker, Scatter, Decompose, Heatmap)
- **Hummingbot handoff** — approved routes submitted to Hummingbot's paper-trade engine with a timestamped execution timeline
- **Clean fallback** — if Hummingbot is unreachable, the system falls back to mock execution and tells you exactly why
- **Persistent dashboard** — execution history, simulation library, CSV export, wallet management, and per-user account via NextAuth

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Next.js Frontend               │
│  Mission Control · Dashboard · Settings     │
│  Prisma + LibSQL (Turso) · NextAuth v5      │
└─────────────────┬───────────────────────────┘
                  │ REST
                  ▼
┌─────────────────────────────────────────────┐
│              FastAPI Backend                │
│  market_data_service  (CoinGecko/Birdeye)  │
│  opportunity_engine   (spread detection)   │
│  feasibility_engine   (Monte Carlo)        │
│  hummingbot_adapter   (execution handoff)  │
│  execution_store      (run tracking)       │
└─────────────────┬───────────────────────────┘
                  │ approved routes only
                  ▼
┌─────────────────────────────────────────────┐
│           Hummingbot Paper Trade            │
│  REST control surface · mock fallback      │
└─────────────────────────────────────────────┘
```

---

## Repo Layout

```
owlsight/
├── backend/          FastAPI API, opportunity engine, Hummingbot adapter
├── frontend/         Next.js app — Mission Control, dashboard, settings
├── hummingbot/       Request payload examples and integration notes
└── docs/             Demo script and architecture notes
```

---

## Local Setup

### Backend

```bash
cd backend
cp .env.example .env        # fill in your API keys
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # fill in your values
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npm run dev
```

App runs at `http://localhost:3000`, API at `http://localhost:8000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `COINGECKO_API_KEY` | CoinGecko API key |
| `COINGECKO_API_TIER` | `pro` or `demo` |
| `BIRDEYE_API_KEY` | Birdeye API key |
| `MARKET_DATA_PROVIDER` | `coingecko` · `birdeye` · `mock` |
| `EXECUTION_MODE` | `paper_hummingbot` · `mock` |
| `HUMMINGBOT_API_URL` | Hummingbot control surface URL |
| `DEMO_FORCE_HB_CONNECTED` | `true` to simulate Hummingbot connected (no Hummingbot needed) |
| `FRONTEND_ORIGIN` | Frontend URL for CORS |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend URL |
| `DATABASE_URL` | SQLite: `file:./dev.db` · Turso: `libsql://...` |
| `NEXTAUTH_SECRET` | Random secret for session encryption |
| `NEXTAUTH_URL` | App URL |
| `COINGECKO_API_KEY` | CoinGecko key (server-side only) |
| `BIRDEYE_API_KEY` | Birdeye key (server-side only) |

---

## Execution Modes

| Mode | Behaviour |
|---|---|
| `paper_hummingbot` | Submits approved routes to Hummingbot paper-trade surface. Falls back to mock if unreachable. |
| `mock` | Fully local simulation, no Hummingbot dependency. |
| `DEMO_FORCE_HB_CONNECTED=true` | Simulates Hummingbot as connected for screenshots/demos — no real Hummingbot needed. |

---

## Market Data

| Provider | Description |
|---|---|
| `coingecko` | Live prices via CoinGecko Pro API |
| `birdeye` | Live Solana + cross-chain DEX data via Birdeye |
| `mock` | Deterministic local feed — no API keys needed |

If a live provider fails or rate-limits, the backend falls back to mock and surfaces the reason in the UI.

---

## Deploying

### Frontend → Vercel

1. Connect repo to Vercel, set root to `frontend/`
2. Set env vars in Vercel dashboard (see table above)
3. Use [Turso](https://turso.tech) for `DATABASE_URL` (free tier)
4. Run `npx prisma db push` locally once with the Turso URL to push the schema

### Backend → Render

1. Create a new Web Service, set root to `backend/`
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set env vars in Render dashboard, including `FRONTEND_ORIGIN` pointing to your Vercel URL

---

## APIs Used

- **[Anthropic Claude API](https://anthropic.com)** — natural language intent parsing
- **[CoinGecko API](https://coingecko.com)** — real-time cross-chain price data
- **[Birdeye API](https://birdeye.so)** — Solana DEX market data and liquidity
- **[Hummingbot](https://hummingbot.org)** — paper-trade execution engine
- **[WalletConnect / MetaMask](https://walletconnect.com)** — EVM wallet connection via wagmi v2

---

## Documentation

- [Demo Script](docs/DEMO.md)
- [Architecture Notes](docs/ARCHITECTURE.md)
