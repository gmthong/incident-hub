# IncidentHub Docker startup

The root `docker-compose.yml` builds one `incidenthub-api:latest` image and runs it in three modes through `docker/start.sh`:

- `migrate`: runs `alembic upgrade head` once
- `web`: starts `uvicorn src.main:app`
- `worker`: starts `celery -A src.celery_tasks.celery_app worker`

PostgreSQL and Redis have health checks. The migration service waits for PostgreSQL, while the API and worker wait for both successful migrations and healthy Redis.

From the repository root:

```bash
cp backend/.env.example backend/.env
docker compose up --build -d
docker compose ps
docker compose logs migrate app background-worker
```

The stack uses these dedicated resources:

- `incidenthub-db`
- `incidenthub-redis`
- `incidenthub-migrate` (container disabled after initial boot of server)
- `incidenthub-app`
- `incidenthub-background-worker`
- `incidenthub_postgres_data` (volume)
- `incidenthub_redis_data` (volume)

Stopping with `docker compose down` keeps the database and Redis volumes. Do not add `-v` unless deleting the new IncidentHub data is intentional.

Schema creation belongs exclusively to Alembic; the web startup path does not call `SQLModel.metadata.create_all()`.
