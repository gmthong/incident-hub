#!/bin/sh
set -e

mode="${1:-web}"

if [ "$mode" = "worker" ]; then
  exec celery -A src.celery_tasks.celery_app worker --loglevel=info
fi

if [ "$mode" = "migrate" ]; then
  exec alembic upgrade head
fi

exec uvicorn src.main:app --host 0.0.0.0 --port 8000
