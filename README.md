# Instagram AI Platform

An AI-powered Instagram DM management platform. The AI handles incoming customer messages using a knowledge base you curate, with a human-in-the-loop approval flow for edge cases.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser                    │
│         Next.js 14 App Router (React)       │
│  TanStack Query · Zustand · Tailwind CSS    │
└───────────────────┬─────────────────────────┘
                    │ REST (JSON)
┌───────────────────▼─────────────────────────┐
│          FastAPI Backend (Python)           │
│   Auth · Workspaces · Conversations · AI    │
└──────┬──────────────────────────┬───────────┘
       │ SQL (Postgres)           │ Broker
┌──────▼───────┐          ┌──────▼───────────┐
│  PostgreSQL  │          │  Redis + Celery  │
│  (primary DB)│          │  (async tasks)   │
└──────────────┘          └──────────────────┘
                                  │
                    ┌─────────────▼───────────┐
                    │   Meta Graph API        │
                    │  (Instagram DMs / hooks)│
                    └─────────────────────────┘
```

---

## Local development

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker Desktop (for Postgres + Redis via docker-compose)

### 1. Start backing services

```bash
cd backend
docker compose up -d          # Postgres + Redis
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local   # then fill in values
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base URL, e.g. `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | — | UI display name (default: `Replyr`) |

### Backend (`backend/.env`)

See `backend/README.md` for the full list (database URL, Redis URL, Meta App credentials, JWT secret, etc.).

---

## Scripts

### Frontend

| Script | Command |
|---|---|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Type-check | `npm run type-check` |
| Lint | `npm run lint` |
| Preview build | `npm run start` |

### Backend

| Script | Command |
|---|---|
| Dev server | `uvicorn app.main:app --reload` |
| Run migrations | `alembic upgrade head` |
| Generate migration | `alembic revision --autogenerate -m "description"` |
| Run tests | `pytest` |
| Celery worker | `celery -A app.core.celery_app worker --loglevel=info` |

---

## Docker (production)

```bash
# Frontend
cd frontend
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1 \
  -t replyr-frontend .

# Backend (see backend/Dockerfile)
cd backend
docker build -t replyr-backend .
```

---

## Milestones

- [x] M1 — Auth (JWT login / register)
- [x] M2 — Workspaces
- [x] M3 — Instagram accounts & webhook ingestion
- [x] M4 — Conversation list + message thread
- [x] M5 — AI reply flow (auto-reply + approval queue)
- [x] M6 — Knowledge base (document upload + Q&A)
- [x] M7 — Production polish (errors, skeletons, polling, command palette, keyboard shortcuts, onboarding, responsive, a11y, performance, build)
