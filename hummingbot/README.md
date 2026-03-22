# Hummingbot Integration

## Hummingbot's Role in This System

Hummingbot is the execution engine, not the opportunity brain.

OwlSight performs:

1. market data ingestion
2. opportunity detection
3. feasibility scoring
4. execution approval

Only after those steps does the backend hand the route to the Hummingbot adapter.

---

## Local Setup

### 1. Start Hummingbot + Gateway

```bash
make hummingbot-up
```

This starts two Docker containers:

| Container    | Purpose                              | Port  |
|-------------|--------------------------------------|-------|
| `hummingbot` | CLI trading bot (CEX execution)      | —     |
| `gateway`    | DEX middleware (REST API)            | 15888 |

Gateway exposes the REST API the OwlSight backend connects to at `http://localhost:15888`.

### 2. Configure the Hummingbot CLI (first time only)

Attach to the running container:

```bash
make hummingbot-attach
```

- Set a password when prompted (this encrypts your API keys)
- Connect an exchange for paper trading:

```
connect binance_paper_trade
```

- Verify Gateway is online — you should see **Gateway: ONLINE** in the top-right corner.

Detach without stopping: `Ctrl+P` then `Ctrl+Q`

### 3. Configure the OwlSight backend

Copy `.env.example` to `.env` and confirm these values:

```
HUMMINGBOT_ENABLED=true
HUMMINGBOT_API_URL=http://localhost:15888
HUMMINGBOT_INSTANCE_NAME=paper-demo
HUMMINGBOT_PAPER_TRADE=true
EXECUTION_MODE=paper_hummingbot
```

---

## Docker Compose Environment Variables

| Variable                    | Default    | Description                          |
|-----------------------------|------------|--------------------------------------|
| `HUMMINGBOT_CONFIG_PASSWORD` | `owlsight` | Encrypts Hummingbot conf files       |
| `GATEWAY_PASSPHRASE`         | `owlsight` | Encrypts Gateway wallet keys         |

Set these in a `.env` file inside `hummingbot/` to override.

---

## Execution Modes

### `EXECUTION_MODE=mock`

- Produces a `TradeExecutionRequest`.
- Writes a request artifact into `hummingbot/requests/`.
- Simulates a mock execution lifecycle — no Hummingbot needed.

### `EXECUTION_MODE=paper_hummingbot`

- Attempts a paper-trade submission to Gateway at `HUMMINGBOT_API_URL`.
- Falls back to mock execution automatically if Gateway is unreachable.

---

## Managing Hummingbot

| Command                  | Action                              |
|--------------------------|-------------------------------------|
| `make hummingbot-up`     | Start Hummingbot + Gateway          |
| `make hummingbot-down`   | Stop both containers                |
| `make hummingbot-attach` | Open the Hummingbot CLI             |
| `make hummingbot-logs`   | Stream container logs               |
| `make hummingbot-update` | Pull latest images and restart      |

---

## Request Artifacts

Every execution (mock or live) writes a JSON artifact to `hummingbot/requests/`:

```
hummingbot/requests/hbreq-<10-char-id>.json
```

See `sample_execution_request.json` for the payload structure.
