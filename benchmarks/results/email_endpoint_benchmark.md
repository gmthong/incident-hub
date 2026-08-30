# Endpoint Performance Report

Date: 11/08/2026
Project: IncidentHub
Scope: API endpoint response speed (return latency)

## What Was Measured

This report documents endpoint return time for the auth email flows:

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/password_reset_request`

The benchmark measures client-observed response latency only. It does not measure whether the email was delivered to the inbox, only how quickly the endpoint returned a response.

## Benchmark Setup

- Foreground Email Sending: change code to sending email in the foreground
- Background Email Sending: change code to sending email in the background using Celery
- Email content is fixed everytime
- Runs per endpoint: `10`

## Results

### Baseline

- Signup average: `16636.52 ms`
- Signup min: `15853.49 ms`
- Signup max: `17203.74 ms`
- Password reset average: `15517.27 ms`
- Password reset min: `15204.70 ms`
- Password reset max: `15743.56 ms`

### Background Tasks Enabled

- Signup average: `556.98 ms`
- Signup min: `292.75 ms`
- Signup max: `1067.77 ms`
- Password reset average: `2.93 ms`
- Password reset min: `2.05 ms`
- Password reset max: `4.26 ms`

## Improvement

- Signup latency improvement: about `96.7%`
- Password reset latency improvement: about `99.98%`

## Notes

- The current report reflects the successful comparable 10-run baseline/background comparison.
- Notice the scripts for this benchmark was not preserved.