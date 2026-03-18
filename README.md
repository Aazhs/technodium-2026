# Technodium 2026

Technodium 2026 is a registration portal for a multi-round college tech event. The project uses a React + Vite frontend, a FastAPI backend, and Supabase for authentication and registration storage.

## Stack

- Frontend: React 19, TypeScript, Vite, React Router, Axios
- Backend: FastAPI, Supabase Python client
- Deployment: Vercel

## Project Structure

```text
.
├── api/index.py              # FastAPI API for auth, registration, health
├── frontend/                 # Source React app
│   ├── src/pages/            # Route-level pages
│   ├── src/components/       # Shared UI components
│   ├── src/api.ts            # Frontend API client
│   └── public/static/        # CSS, images, JS assets
├── requirements.txt          # Python dependencies
├── package.json              # Root production build wrapper
└── vercel.json               # Vercel routing/build config
```

`dist/` and `public/` are generated build outputs. Treat `frontend/` as the source of truth.

## Local Development

Run the backend and frontend in separate terminals.

### Backend

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn api.index:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Open `http://127.0.0.1:5173`.

## Environment Variables

Create a root `.env` file with:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
ENV=production
```

For local development, `ENV` can be omitted.

## API Overview

The frontend calls the backend through `/api/*`. Main endpoints include:

- `GET /api/user`
- `GET /api/ps-counts`
- `GET /api/registration`
- `POST /api/signup`
- `POST /api/login`
- `POST /api/logout`
- `POST /api/forgot-password`
- `POST /api/reset-password`
- `POST /api/register`
- `PUT /api/register`
- `GET /api/health`

## Build and Deploy

```bash
npm run build
```

This runs the frontend production build and prepares the static output used by Vercel.

For Vercel:

1. Import the repository.
2. Set `SUPABASE_URL`, `SUPABASE_KEY`, and `ENV=production`.
3. Deploy using the existing `vercel.json` configuration.

## Validation

Before pushing deployment-related changes, run:

```bash
npm --prefix frontend run lint
npm run build
```
