SHELL := /bin/zsh

.PHONY: frontend-install frontend-dev backend-venv backend-install backend-dev backend-test

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

