SHELL := /bin/zsh

.PHONY: frontend-install frontend-dev backend-venv backend-install backend-dev backend-test \
        hummingbot-up hummingbot-down hummingbot-attach hummingbot-logs hummingbot-update

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

backend-venv:
	cd backend && python3 -m venv .venv

backend-install:
	cd backend && source .venv/bin/activate && python -m pip install -r requirements.txt

backend-dev:
	cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

backend-test:
	cd backend && source .venv/bin/activate && pytest

# ── Hummingbot ──────────────────────────────────────────────────────────────

hummingbot-up:
	cd hummingbot && docker compose up -d gateway
	@echo "Gateway listening on http://localhost:15888"
	@echo "Run 'make hummingbot-start' to open the Hummingbot CLI"

hummingbot-start:
	cd hummingbot && docker compose run --rm hummingbot

hummingbot-down:
	cd hummingbot && docker compose down

hummingbot-logs:
	cd hummingbot && docker compose logs -f

hummingbot-update:
	cd hummingbot && docker compose down
	docker pull hummingbot/hummingbot:latest
	docker pull hummingbot/gateway:latest
	cd hummingbot && docker compose up -d

