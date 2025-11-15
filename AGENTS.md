# Repository Guidelines

This repository is a minimal full‑stack web app for SQLite management, with a FastAPI backend and a React (JavaScript) frontend.

## Project Structure & Module Organization
- `backend/`: FastAPI app (`main.py`), SQLite helpers (`db.py`), Pydantic models (`models.py`), and `requirements.txt`.
- `frontend/`: React app with `src/App.js`, `src/components/` (UI pieces), and `src/api.js` for HTTP calls.
- `data/`: SQLite files such as `app.db`; use non‑sensitive sample data only.
- Keep new backend modules under `backend/` and new React components under `frontend/src/components/`.

## Build, Test, and Development Commands
- Backend dev: `cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8100` (use 8100 to avoid common 8000 clashes).
- Frontend dev: `cd frontend && npm install && PORT=3100 npm start` (use 3100 to avoid common 3000 clashes).
- Backend tests (when added): `cd backend && pytest`.
- Frontend tests (when added): `cd frontend && npm test`.
- Production frontend build: `cd frontend && npm run build`.

## Coding Style & Naming Conventions
- Python (backend): 4‑space indents, PEP 8 style; `snake_case` for functions/variables, `PascalCase` for classes. Keep path operations in `main.py` and DB logic in `db.py`.
- JavaScript (frontend): Prefer functional React components; `PascalCase` for components, `camelCase` for functions/variables. Keep API wrappers in `src/api.js`. Use existing formatter/linter configs if present.

## Testing Guidelines
- Place backend tests in `backend/tests/` as `test_*.py` using `pytest`.
- Place frontend tests alongside components as `*.test.js` using Jest/React Testing Library.
- For features affecting both sides, add at least one backend test and one UI test, and run `pytest` and `npm test` before submitting.

## Commit & Pull Request Guidelines
- Use small, focused commits with imperative messages (e.g., `Add table schema endpoint`, `Wire result table pagination`).
- Reference issues in commit bodies or PR descriptions when applicable.
- PRs should include: purpose summary, key changes, how to run backend/frontend, what was tested, and screenshots/GIFs for visible UI changes.
- Ensure `uvicorn main:app --reload --port 8100` and `PORT=3100 npm start` both work before requesting review.

## Security & Configuration Tips
- Do not hard‑code secrets, API keys, or production database paths; prefer environment variables or configuration files ignored by Git.
- Keep shipped SQLite data in `data/` non‑sensitive and suitable for sharing and testing.
