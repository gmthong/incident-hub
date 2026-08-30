# IncidentHub Local API Load Results After Pagination

Run on 30–31 August 2026 using k6 2.2.0 profiles and the same pass criteria as the [pre-pagination baseline](./api-load-no-pagination.md). These are local development-machine measurements, not a production capacity claim.

## Some backend changes implemented to improve performance

- Incident and user list endpoints now perform server-side pagination.
- Page size defaults to 50 and cannot exceed 50 records.
- Search, filters, and sorting are applied in PostgreSQL before pagination.
- Dashboard counts use aggregate queries rather than loading every incident.
- The k6 setup step was updated to read incident IDs from the paginated `items` field.

No worker, database-pool, Uvicorn-worker, or logging optimization was included, so the primary change under test was pagination and its necessary API adaptations.

## Test Environment and Criteria

- Apple M1 Pro MacBook Pro with 8 CPU cores and 16 GB host memory
- Docker Desktop allocated 8 CPUs and approximately 7.65 GiB memory
- One FastAPI/Uvicorn application process
- PostgreSQL 17 and Redis 7 in isolated containers
- Synthetic clean baseline before each comparable mixed run: 500 verified users, 1,000 incidents, 1,000 analyses, and 12 categories
- Frontend and Celery worker excluded from the benchmark stack
- Pass: error rate below 1% and measured-operation p95 below 1,000 ms

The normal IncidentHub backend containers were also present but idle on the same Docker host during these post-pagination runs. This is a local-environment limitation.

## Results

| Profile | Load | Measured operations | Throughput | p50 | p95 | p99 | Error rate | Result |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Smoke validation | 2 VUs, 20 mixed iterations | 20 | 1.61 ops/s | 21 ms | 142 ms | 149 ms | 0% | Pass |
| Volume read | 20 VUs, exactly 1,000 detail reads | 1,000 | 121.58 ops/s | 145 ms | 218 ms | 459 ms | 0% | Pass |
| Steady mixed | 10 VUs for 2 minutes, repeat 1 | 1,110 | 9.16 ops/s | 22 ms | 202 ms | 317 ms | 0% | Pass |
| Steady mixed | 10 VUs for 2 minutes, repeat 2 | 1,090 | 8.97 ops/s | 26 ms | 196 ms | 645 ms | 0% | Pass |
| Steady mixed | 10 VUs for 2 minutes, repeat 3 | 1,115 | 9.19 ops/s | 25 ms | 178 ms | 523 ms | 0% | Pass |
| Steady mixed | Median of 3 clean repeats | 1,110 | 9.16 ops/s | 25 ms | 196 ms | 523 ms | 0% | 3 of 3 passed |
| Steady mixed | 25 VUs for 2 minutes | 2,444 | 20.13 ops/s | 94 ms | 686 ms | 1.53 s | 0% | Pass |
| Steady mixed | 50 VUs for 2 minutes | 3,050 | 24.97 ops/s | 680 ms | 1.96 s | 4.08 s | 0% | Fail latency |
| Ramping mixed | Ramp to and hold 100 VUs | 5,312 | 19.59 ops/s | 2.22 s | 5.79 s | 8.40 s | 0% | Fail latency |
| Breaking-point stress | Ramp through 100 and 250, then hold 500 VUs | 2,585 | 12.05 ops/s | 27.57 s | 32.30 s | 52.27 s | 28.89% | Reached 500; overloaded |

The mixed profiles include a random 0.5–1.5 second think time after every operation. Their throughput must not be directly compared with the no-think-time volume profile.

### 500-User Breaking-Point Details

- The profile ramped to 100 users in 30 seconds, 250 users after another 30 seconds, 500 users over the next minute, and then held 500 users for one minute before ramp-down.
- k6 reached `vus_max=500`; all 500 virtual users eventually established a session after retries.
- Virtual-user login attempts had a 22.36% error rate during overload: 500 successful attempts and 144 failed attempts.
- Measured application operations had a 28.89% error rate: 747 failures out of 2,585 operations.
- Across all HTTP traffic, 891 of 3,231 requests failed, or 27.57%.
- The run completed 2,726 workflow iterations and 2,585 measured operations at 12.05 measured operations per second.
- Measured-operation latency was 27.57 seconds at p50, 32.30 seconds at p95, 52.27 seconds at p99, and 60 seconds maximum.
- Failures included client request timeouts and HTTP 500 responses. Application logs repeatedly showed SQLAlchemy pool timeouts: pool size 5, maximum overflow 10, and a 30-second connection timeout.
- During the 500-user hold, the application container used about 108% CPU, PostgreSQL about 60%, and Redis about 3%. Memory remained modest at approximately 158 MiB for the API and 125 MiB for PostgreSQL.

This proves that the test harness can create and hold 500 concurrent virtual users. It does **not** mean that IncidentHub supports 500 responsive concurrent users.

## Before Pagination vs After Pagination

| Comparable result | Before pagination | After pagination | Change |
|---|---:|---:|---:|
| 1,000-read throughput | 88.54 ops/s | 121.58 ops/s | 37.3% higher |
| 1,000-read p95 | 483 ms | 218 ms | 54.9% lower |
| 10-user median throughput | 7.12 ops/s | 9.16 ops/s | 28.5% higher |
| 10-user median p95 | 1.30 s | 196 ms | 84.9% lower |
| 10-user passing repeats | 1 of 3 | 3 of 3 | Reliable pass after change |
| 25-user throughput | 6.14 ops/s | 20.13 ops/s | 228% higher |
| 25-user p95 | 6.42 s | 686 ms | 89.3% lower |
| 100-user throughput | 6.13 ops/s | 19.59 ops/s | 220% higher |
| 100-user p95 | 24.50 s | 5.79 s | 76.4% lower |
| 100-user error rate | 1.62% | 0% | Connection-pool errors eliminated in this run |
| 100-user k6 data received | 333 MB | 45 MB | 86.5% lower |

Percentages are rounded from the raw k6 values.

## Interpretation

- Pagination materially improved every comparable scenario.
- The focused read profile now sustains 121.58 authenticated incident-detail reads per second with 218 ms p95 and zero errors.
- Ten mixed concurrent users now pass reliably: all three clean repeats met the latency and error thresholds.
- Twenty-five mixed users now pass, making 25 the highest tested passing steady level under the chosen one-second p95 objective.
- Fifty mixed users return correct responses but miss the latency objective, making 50 the lowest tested failing steady level. The exact boundary is somewhere between these tested levels and was not claimed.
- At 100 users, pagination removed the observed connection-pool errors and greatly reduced latency and transferred response data, but the single application process still cannot meet the latency target.
- During the 100-user hold, the application container used about 102% CPU, PostgreSQL about 11%, and Redis below 1%. This continues to point to the single API process and request/query work as the immediate local bottleneck rather than PostgreSQL CPU.
- The breaking-point profile successfully reached and held 500 virtual users, but the system was deeply overloaded: 28.89% measured-operation errors and 32.30-second p95 latency.
- At 500 users, both the single API process and the 15-connection SQLAlchemy pool were saturated; PostgreSQL work also increased substantially compared with the 100-user run.

## Defensible Achievement Statements

- Implemented server-side pagination that increased authenticated incident-read throughput by 37%, from 88.54 to 121.58 requests per second, while reducing p95 latency by 55% on a 1,000-request local Docker benchmark.
- Reduced mixed-workload p95 latency at 25 concurrent users from 6.42 seconds to 686 milliseconds and increased throughput by 228%, with zero request errors.
- Eliminated observed HTTP errors at 100 simulated users and reduced p95 latency by 76%, while documenting the remaining single-process performance boundary.
- Executed a 500-virtual-user breaking-point test that identified SQLAlchemy connection-pool saturation and quantified overload at a 28.89% operation error rate.

These statements must retain the local Docker benchmark context when used in project documentation or a résumé discussion.

## Remaining Limitations

- The load generator and system under test shared one laptop.
- The environment did not include production networking, TLS, a reverse proxy, application replicas, or a remote managed database.
- The application used one Uvicorn process with its current SQLAlchemy connection-pool configuration.
- The benchmark used synthetic data and a read-heavy workflow.
- Request logging remained enabled.
- The 25-, 50-, and 100-user figures are single-run observations; only the 10-user result was repeated three times.