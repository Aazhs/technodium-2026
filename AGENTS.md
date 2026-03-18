# Repository Guidelines

## Project Structure & Module Organization
`frontend/` contains the source React + Vite app. Main entry points are `frontend/src/main.tsx`, `frontend/src/App.tsx`, page views in `frontend/src/pages/`, shared UI in `frontend/src/components/`, and static assets in `frontend/public/static/`.  
`api/index.py` is the FastAPI backend used for Vercel serverless routes, with Python dependencies in the root `requirements.txt`.  
`vercel.json` defines deployment routing. Root `dist/` and `public/` are generated build outputs; treat `frontend/` as the source of truth and avoid editing generated files directly.

## Build, Test, and Development Commands
- `uvicorn api.index:app --reload --host 127.0.0.1 --port 8000` runs the backend locally.
- `npm --prefix frontend install && npm --prefix frontend run dev` starts the Vite frontend on `http://127.0.0.1:5173`.
- `npm --prefix frontend run lint` runs the frontend ESLint checks.
- `npm run build` performs the production build used for Vercel deployment.

Run frontend and backend in separate terminals for full local development.

## Coding Style & Naming Conventions
Use TypeScript with React function components and Python with FastAPI. Follow existing formatting: 2-space indentation in frontend files, 4-space indentation in Python. Use `PascalCase` for React components/pages, `camelCase` for functions and variables, and `UPPER_SNAKE_CASE` for environment variables. Keep styles in `frontend/public/static/css/style.css` unless a component-specific inline style is clearly simpler.

## Testing Guidelines
There is no dedicated automated test suite yet. Before opening a PR, run `npm --prefix frontend run lint` and `npm run build`, then manually verify the affected flow in the browser. For backend or auth changes, also check `GET /api/health`, login/signup, and registration flows.

## Commit & Pull Request Guidelines
Recent history uses very short commit messages (`fix`, `try`), but contributors should prefer clear imperative summaries such as `frontend: refine hero shadows` or `api: simplify auth cookie handling`. Keep PRs focused, describe user-facing changes, note any Vercel or Supabase config impact, and include screenshots for UI changes.

## Security & Configuration Tips
Keep `.env` local and never commit secrets. The backend expects `SUPABASE_URL`, `SUPABASE_KEY`, and optionally `ENV=production` for secure cookies in deployed environments.
