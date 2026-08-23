FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential gcc curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 incidenthub \
    && useradd --uid 10001 --gid incidenthub --create-home incidenthub

COPY requirements.txt ./requirements.txt
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

COPY --chown=incidenthub:incidenthub . .

RUN chmod +x /app/docker/start.sh

USER incidenthub

EXPOSE 8000

ENTRYPOINT ["/app/docker/start.sh"]
