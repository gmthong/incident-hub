# IncidentHub API Load Benchmark

This benchmark measures the FastAPI backend only. It uses an isolated PostgreSQL database and Redis volume, synthetic verified accounts, and k6 running inside Docker. It does not use the React frontend or start a Celery worker.

## Files

- `docker-compose.api-load.yml`: isolated API, PostgreSQL, Redis, migration, seed, and k6 services.
- `seed_api_load.py`: creates deterministic synthetic users, incidents, analyses, and categories.
- `api_load.js`: k6 smoke, 1,000-operation volume, configurable steady-load, 100-user concurrency, and 500-user stress profiles.
- `results/`: preserved benchmark reports and environment details.

The results directory contains the original baseline and a directly comparable post-pagination rerun.

## Prepare the Isolated Stack

Run commands from the repository root:

```bash
docker compose -f benchmarks/docker-compose.api-load.yml up --build -d db redis migrate app
docker compose -f benchmarks/docker-compose.api-load.yml run --rm seed
```

The isolated benchmark API is available at `http://localhost:8001`. The default seed contains 500 verified engineers, 1,000 incidents, 1,000 analyses, and 12 categories. Every account uses the synthetic password `LoadTest1`.

## Run Profiles

Quick correctness check:

```bash
docker compose -f benchmarks/docker-compose.api-load.yml run --rm -e PROFILE=smoke k6
```

Exactly 1,000 measured incident-detail operations across 20 virtual users:

```bash
docker compose -f benchmarks/docker-compose.api-load.yml run --rm -e PROFILE=volume k6
```

Constant load, for example 25 users for two minutes:

```bash
docker compose -f benchmarks/docker-compose.api-load.yml run --rm -e PROFILE=steady -e STEADY_VUS=25 -e STEADY_DURATION=2m k6
```

Repeat the steady profile at increasing user counts to identify the highest level that passes both thresholds.

Read-heavy user workflows ramping through 10, 25, 50, and 100 concurrent users:

```bash
docker compose -f benchmarks/docker-compose.api-load.yml run --rm -e PROFILE=concurrency k6
```

Stress test ramping through 100 and 250 users before reaching 500 concurrent users:

```bash
docker compose -f benchmarks/docker-compose.api-load.yml run --rm -e PROFILE=stress k6
```

Run the stress profile only after the concurrency profile completes. Five hundred local virtual users are intended to find the system's breaking point, not to assume that 500 users are supported.

During the stress profile, a failed virtual-user login is recorded in `login_error_rate` and retried on a later iteration instead of aborting the entire run. Other profiles still abort when a virtual user cannot establish its session.

The concurrency workflow is 90% reads and 10% writes. Each virtual user signs in once, then waits 0.5–1.5 seconds between operations to simulate user think time.

To preserve console output:

```bash
docker compose -f benchmarks/docker-compose.api-load.yml run --rm -e PROFILE=volume k6 2>&1 | tee benchmarks/results/volume.txt
```

## Pass Criteria

- Measured operation error rate below 1%.
- Overall measured-operation p95 latency below 1,000 ms.

`benchmark_requests` excludes setup and login traffic. `benchmark_latency` reports measured-operation latency, and `benchmark_error_rate` reports unexpected response statuses.

## Reset Benchmark Data

The following command deletes only the dedicated `incidenthub_api_benchmark_postgres_data` and `incidenthub_api_benchmark_redis_data` volumes:

```bash
docker compose -f benchmarks/docker-compose.api-load.yml down --volumes
```

Run the preparation commands again to obtain the same baseline dataset.
