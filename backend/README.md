# IncidentHub Backend

## Structure

- `src/`: FastAPI application code.
  - `auth/`: registration, authentication, tokens, verification, and password reset.
  - `users/`: admin user lookup and updates.
  - `incidents/`: incident routes, schemas, and business rules.
  - `analyses/`: incident-analysis operations and permissions.
  - `categories/`: category management.
  - `db/`: SQLModel tables, enums, sessions, and Redis helpers.
  - `main.py`: application entrypoint and router registration.
  - `celery_tasks.py`, `email.py`, `notifications.py`: background email delivery.
- `migrations/`: Alembic schema revisions.
- `tests/`: backend endpoint and service tests.
- `RestFox/`: manual API request examples.
- `docker/`: backend image and startup script.
- `docs/`: supporting backend notes.
- `requirements*.txt`: runtime and development dependencies.

## Run the Backend Only

Local development from `backend/` requires PostgreSQL and Redis matching `.env`:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
cp .env.example .env
.venv/bin/python -m alembic upgrade head
.venv/bin/python -m uvicorn src.main:app --reload
```

Start the worker in another terminal:

```bash
.venv/bin/python -m celery -A src.celery_tasks.celery_app worker --loglevel=info
```

Alternatively, start the backend stack without the frontend from the repository root:

```bash
docker compose up --build -d db redis migrate app background-worker
```

The API runs at `http://localhost:8000`.
