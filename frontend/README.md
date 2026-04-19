# Frontend (React + Vite)

Quick start for local development.

## Prerequisites
- Node.js 20+

## Run
1. Create env file in frontend root:
   - `Copy-Item .env.example .env`
2. Install deps:
   - `npm install`
3. Start dev server:
   - `npm run dev`

## Useful commands
- `npm run typecheck`
- `npx vitest run`
- `npm run build`

## Backend wiring
- Set `VITE_API_URL=http://localhost:8000/api/v1` in `.env`
- Backend must allow CORS for `http://localhost:5173`
