# Repository Guidelines

## Project Structure & Module Organization
Place the Vite frontend in `frontend/` with React views in `src/components/`, map logic in `src/features/map/`, hooks in `src/hooks/`, and Tailwind in `src/styles/`. FastAPI lives in `backend/app/` with routers in `app/api/`, services in `app/services/`, and Pydantic models in `app/schemas/`. Keep backend unit tests in `backend/tests/`, browser flows in `tests/e2e/`, and GeoJSON snippets under 5 MB in `data/fixtures/`.

## Build, Test, and Development Commands
Install Node dependencies with `npm install` (Node 20). Use `npm run dev` for the dev server, `npm run build` for production bundles, `npm run preview` to smoke-test, and `npm run lint` for ESLint, Prettier, and Tailwind ordering. Backend workflow: `python -m venv .venv`, activate, `pip install -e backend[dev]`, then `uvicorn backend.app.main:app --reload`. Run `npm run test -- --coverage` for Vitest suites and `pytest --cov backend/app` for FastAPI coverage. Use Python 3.11 for everything Python related.

## Coding Style & Naming Conventions
Code against React 18 + TypeScript 5.9 using ESLint (Airbnb + React hooks) and Prettier with the Tailwind plugin. Components and files are PascalCase, hooks start with `use`, and utility modules stay camelCase. Tailwind utilities should read `layout → display → color`. Python targets 3.12, sticks to 4-space indentation, and is linted with `ruff check backend/app` plus `black backend/app`. Keep REST paths kebab-case and prefix environment variables with `DTCC_`.

## Map Interaction Expectations
Default view centers Sweden at zoom 6. Show SWEREF 99 TM coordinates (EPSG:3006) next to the pointer. Offer basemap toggles for OSM light, dark, satellite, and terrain via `frontend/src/config/basemaps.ts`. MVP selection must support draggable bounding boxes and drawn polygons; design the state so OSM administrative searches can plug in later. Route Swedish requests to the DTCC backend; fall back to OSM elsewhere.

## Testing Guidelines
Use Vitest with Testing Library for `*.test.tsx` files and Playwright in `tests/e2e/` for map flows. Snapshot coordinate conversions and polygon payloads with fixtures in `data/fixtures/`. Backend tests rely on `pytest`, `pytest-asyncio`, and `httpx.AsyncClient`, named `test_<feature>.py`. Enforce ≥85 % coverage across frontend and backend, and add regression checks whenever CRS math, basemap config, or selection serialization shifts.

## Commit & Pull Request Guidelines
Stick to Conventional Commits (`feat:`, `fix:`, `chore:`) with imperative subjects ≤50 characters. PRs should outline user impact, list validation (`npm run lint`, `npm run test`, `pytest --cov`), and attach screenshots for map changes. Link issues or ADRs, flag new environment variables, and note backend endpoints that touch external data. Secure one reviewer; rerun automated checks after revisions.
