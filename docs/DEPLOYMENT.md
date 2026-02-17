# Deployment Guide

## Scope
This document defines how to deploy the API to staging and production using GitHub Actions and Docker.

## Required GitHub Secrets
Set these repository or environment secrets before enabling deploys.

Staging:
- `STAGING_SSH_HOST`
- `STAGING_SSH_USER`
- `STAGING_SSH_KEY`
- `STAGING_DATABASE_URL`
- `STAGING_AUTH_SECRET`
- `STAGING_BOOTSTRAP_ADMIN_KEY`
- `STAGING_API_PORT` (optional, defaults to `4000`)

Production:
- `PROD_SSH_HOST`
- `PROD_SSH_USER`
- `PROD_SSH_KEY`
- `PROD_DATABASE_URL`
- `PROD_AUTH_SECRET`
- `PROD_BOOTSTRAP_ADMIN_KEY`
- `PROD_API_PORT` (optional, defaults to `4000`)

## Workflow Behavior
- File: `.github/workflows/deploy.yml`
- Auto deploy to staging:
  - Trigger: push to `main` that changes API/DB/deploy files.
  - Actions:
    1. Build and push API image to GHCR.
    2. SSH to staging host.
    3. Run DB migration (`npm --workspace @findaspring/api run db:migrate`).
    4. Restart staging container.
    5. Validate `/ready`.
- Production deploy:
  - Trigger: manual `workflow_dispatch` with `target=production`.
  - Actions: same as staging, but runs against production host/secrets.

## First-Time Host Setup
Run once on each host:

```bash
docker --version
docker login ghcr.io
```

Ensure the host firewall allows inbound traffic for `API_PORT`.

## Manual Migration Command
For emergency/manual operation:

```bash
docker run --rm \
  -e DATABASE_URL="$DATABASE_URL" \
  ghcr.io/<owner>/findaspring-api:<tag> \
  npm --workspace @findaspring/api run db:migrate
```

## Deployment Verification
After deploy:
1. `curl http://<host>:<port>/health` returns `200`.
2. `curl http://<host>:<port>/ready` returns `200`.
3. Basic auth flow works (`/v1/auth/login` on existing account).
4. Meetups list and message send both succeed.
