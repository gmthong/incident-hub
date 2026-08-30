# IncidentHub Local API Load Results

Run on 30 August 2026 using k6 2.2.0. These results are a local development-machine baseline, not a production capacity claim. They were captured before incident-list pagination was implemented and are intentionally retained as the pre-optimization baseline.

The comparable post-pagination results are in [`api-load-post-pagination-2026-08-30.md`](./api-load-post-pagination-2026-08-30.md).

## Test Environment

- Apple M1 Pro MacBook Pro with 8 CPU cores and 16 GB host memory
- Docker Desktop allocated 8 CPUs and approximately 7.65 GiB memory
- One FastAPI/Uvicorn application process
- PostgreSQL 17 and Redis 7 in dedicated Docker containers
- k6 in a Docker container on the same Docker network as the API
- Synthetic baseline: 500 verified engineer accounts, 1,000 incidents, 1,000 analyses, and 12 categories
- Frontend and Celery worker excluded

The pass criteria were a measured-operation error rate below 1% and p95 latency below 1,000 ms.

## Results

| Profile | Load | Measured operations | Throughput | p50 | p95 | p99 | Error rate | Result |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Smoke | 2 VUs, 20 mixed iterations | 20 | 1.65 ops/s | 88 ms | 231 ms | 355 ms | 0% | Pass |
| Volume read | 20 VUs, exactly 1,000 incident-detail reads | 1,000 | 88.54 ops/s | 171 ms | 483 ms | 919 ms | 0% | Pass |
| Steady mixed | 10 VUs for 2 minutes, repeat 1 | 892 | 7.29 ops/s | 241 ms | 991 ms | 2.14 s | 0% | Pass, close to limit |
| Steady mixed | 10 VUs for 2 minutes, repeat 2 | 870 | 7.12 ops/s | 224 ms* | 1.39 s | 2.67 s* | 0% | Fail latency |
| Steady mixed | 10 VUs for 2 minutes, repeat 3 | 858 | 7.02 ops/s | 243 ms | 1.30 s | 1.98 s | 0% | Fail latency |
| Steady mixed | Median of 3 clean repeats | 870 | 7.12 ops/s | — | 1.30 s | — | 0% | 1 of 3 passed |
| Steady mixed | 25 VUs for 2 minutes | 766 | 6.14 ops/s | 2.37 s | 6.42 s | 8.69 s | 0% | Fail latency |
| Ramping mixed | Ramp to and hold 100 VUs | 1,665 | 6.13 ops/s | 10.70 s | 24.50 s | 31.42 s | 1.62% | Fail latency and errors |

`*` Repeat 2's detailed custom-metric summary was not retained; its p50 and p99 are the corresponding all-HTTP values. Login and setup traffic account for only 12 of 882 HTTP requests in that run. Its custom p95 threshold result and measured-operation count, throughput, and error rate were retained.

Throughput for the mixed-user profiles includes a random 0.5–1.5 second think time after each operation. It must not be compared directly with the no-think-time volume-read throughput.

## Interpretation

- IncidentHub completed the focused 1,000-read test with no errors at 88.54 incident-detail reads per second and a 483 ms p95.
- The mixed interactive workload remained functionally correct in all three 10-user repeats, but its median p95 was 1.30 seconds. It therefore did not reliably satisfy the chosen one-second latency objective.
- At 25 users, latency degraded substantially even though responses remained correct.
- At 100 users, the application was overloaded. Logs showed SQLAlchemy connection-pool timeouts (`pool size 5`, `max overflow 10`, `30 second timeout`) producing HTTP 500 responses. The application container also reached about 109% CPU during the run, while PostgreSQL was around 8% CPU.
- The implemented 500-user stress profile was not run. The 100-user profile had already crossed both stop conditions, so increasing to 500 would add load without supporting a defensible capacity claim.

## Limitations

- The load generator and system under test shared one laptop, so they competed for CPU, memory, and Docker resources.
- This did not include production networking, TLS, a reverse proxy, multiple application instances, or a remote managed database.
- One Uvicorn process and the application's current SQLAlchemy pool settings were tested.
- The synthetic dataset and read-heavy workflow approximate usage but cannot represent every production access pattern.
- The unpaginated incident-list request returns the full 1,000-record baseline and generated much of the transferred data.
- Request logging remained enabled and may have affected throughput.
- Only the 10-user steady scenario was repeated three times; the other results are single-run observations.