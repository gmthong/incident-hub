# IncidentHub Docker startup

The root `docker-compose.yml` builds two application images:

- `incidenthub-api:latest` for migrations, the FastAPI API, and Celery
- `incidenthub-frontend:latest` for the built React SPA and unprivileged Nginx runtime

The backend image runs through `backend/docker/start.sh` in three modes:

- `migrate`: runs `alembic upgrade head` once
- `web`: starts `uvicorn src.main:app`
- `worker`: starts `celery -A src.celery_tasks.celery_app worker`

PostgreSQL and Redis have health checks. Migration waits for PostgreSQL; the API and worker wait for successful migration and healthy Redis; the frontend waits for the healthy API.

From the repository root:

```bash
cp backend/.env.example backend/.env
docker compose up --build -d
docker compose ps
docker compose logs migrate app background-worker frontend
```

Open:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- API health: `http://localhost:8000/health`
- Frontend health: `http://localhost:3000/health`

The stack uses six containers/services: `incidenthub-db`, `incidenthub-redis`, the one-shot `incidenthub-migrate`, `incidenthub-app`, `incidenthub-background-worker`, and `incidenthub-frontend`.

It uses the named volumes `incidenthub_postgres_data` and `incidenthub_redis_data`. `docker compose down` preserves them; do not add `-v` unless deletion is intentional.

Schema creation belongs exclusively to Alembic. The web startup path does not call `SQLModel.metadata.create_all()`.

To inspect the running schema and worker:

```bash
docker compose exec app alembic current
docker compose exec background-worker celery -A src.celery_tasks.celery_app inspect ping
```

The frontend API origin is a browser-visible build argument. It defaults to `http://localhost:8000/api/v1` and can be changed before rebuilding:

```bash
VITE_API_BASE_URL=https://api.example.com/api/v1 docker compose build frontend
docker compose up -d frontend
```

See the repository root `README.md` for local development, environment settings, and data-preservation guidance.
