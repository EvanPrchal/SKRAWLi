# SKRAWLi

Warioware inspired drawing minigames built with a FastAPI backend and a React/Vite frontend.

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- PostgreSQL (or another SQL database supported by SQLModel)
- Auth0 application credentials (for local Auth0 login)

## Project Structure

```
SKRAWLi/
├── backend/              # FastAPI service
├── frontend/             # React + Vite client
└── COINS_SETUP.md etc.
```

## Backend Setup

1. `cd backend`
2. `python -m venv .venv && source .venv/bin/activate` (macOS/Linux) or `.venv\Scripts\activate` (Windows)
3. `pip install -r requirements.txt`
4. Export environment variables (`.env` recommended) for:
   - `DATABASE_URL`
   - `AUTH0_DOMAIN`
   - `AUTH0_AUDIENCE`
   - `AUTH0_CLIENT_ID`
   - `AUTH0_CLIENT_SECRET`
5. Run migrations if needed: `alembic upgrade head`
6. Start the API: `uvicorn app.main:app --reload`

Backend will serve at `http://127.0.0.1:8000` by default.

## Frontend Setup

1. `cd frontend`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` if present and set public environment variables (e.g., `VITE_API_URL`)
4. Start the dev server without QR code (optional baseline): `npm run dev`

## Showing the Dev QR Code

The project uses `vite-plugin-qrcode`, already registered in `vite.config.ts`. To display the QR code in your terminal:

1. From `frontend/`, run `npm run dev -- --host`
2. When Vite starts, it prints the local network URLs. The QR code appears beneath those addresses.
3. Scan the code with any QR-capable camera to open the app on the same network. Make sure your phone is on the same Wi-Fi.

### Tips

- Combine `--host` with `--port` if you need a stable port (e.g., `npm run dev -- --host --port 5173`).
- If no QR code appears, confirm that the dev server is reachable via your LAN IP and that the plugin is still listed in `vite.config.ts`.

## Useful Scripts

### Backend

- `uvicorn app.main:app --reload` – FastAPI dev server
- `alembic revision --autogenerate -m "message"` – create migration
- `alembic upgrade head` – apply migrations

### Frontend

- `npm run dev` – Vite dev server (localhost only)
- `npm run dev -- --host` – Vite dev server with LAN/QR
- `npm run build` – production build
- `npm run preview` – preview build output

## Testing & Linting

- Backend tests: add your preferred framework (e.g., `pytest`) and run accordingly.
- Frontend linting: `npm run lint`

## Troubleshooting

- Verify PostgreSQL is running and `DATABASE_URL` is correct.
- Ensure Auth0 credentials are valid; mismatched domain/audience will block authentication.
- If the QR code does not show, double-check the `vite-plugin-qrcode` dependency (`npm ls vite-plugin-qrcode`).

## License

See repository for license details.
