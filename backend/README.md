# Backend (FastAPI)

Quick start for local development.

## Prerequisites
- Python 3.12
- Docker Desktop (for Postgres + Redis)

## Run
1. Copy environment file:
	- `Copy-Item .env.example .env`
2. Start dependencies:
	- `docker compose up -d postgres redis`
   - If `app` is already running in Docker, stop it first: `docker compose stop app celery_worker`
3. Install backend deps:
	- `pip install -e .`
4. Run API:
	- `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

If you see `getaddrinfo failed`, make sure your `.env` uses local hosts:
- `POSTGRES_HOST=localhost`
- `POSTGRES_PORT=5433`
- `REDIS_URL=redis://localhost:6379/0`

## Useful commands
- `docker compose up --build` (run full backend stack in containers)
- `alembic upgrade head` (apply migrations)

## Frontend wiring
- API base path: `http://localhost:8000/api/v1`
- CORS origin: set `FRONTEND_URL=http://localhost:5173` in `.env`
