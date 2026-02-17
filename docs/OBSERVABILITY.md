# Observability

## Structured API Logs
API logs are JSON lines and include:
- `timestamp`
- `level`
- `service`
- `version`
- `request_id`
- request method/path/status/duration fields on request completion

Configuration:
- `LOG_LEVEL` (`debug`, `info`, `warn`, `error`; default `info`)
- `APP_VERSION` (defaults to `GITHUB_SHA` or `dev`)

Each HTTP response includes `x-request-id`.

## Health Endpoints
- `/health`: process-level liveness.
- `/ready`: readiness check (includes DB connectivity).

## Uptime Monitor
- Workflow: `.github/workflows/uptime.yml`
- Schedule: every 30 minutes.
- Required secret:
  - `STAGING_HEALTHCHECK_URL` (for example `https://staging-api.example.com/health`)
- Optional secret:
  - `PROD_HEALTHCHECK_URL`

If the monitor fails, GitHub Actions status will be red and should trigger incident review.
