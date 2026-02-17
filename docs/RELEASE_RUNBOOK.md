# Release and Rollback Runbook

## Pre-Release Checklist
1. CI is green on the release commit (`Lint`, `Typecheck`, `Mobile Tests`, `Unit Tests`, `API Smoke Test`, `Integration Tests (PostGIS)`).
2. Migrations are reviewed and backward-compatible.
3. Staging has run the candidate for at least 24 hours without critical errors.
4. On-call owner is identified for release window.

## Staging Release
1. Merge PR to `main`.
2. Wait for `.github/workflows/deploy.yml` `Deploy Staging` to finish.
3. Validate:
   - `GET /health`
   - `GET /ready`
   - signup/login/refresh flow
   - meetup create + message send
4. If staging fails, fix forward on a new branch and redeploy.

## Production Release
1. Open GitHub Actions -> `Deploy` workflow.
2. Run workflow with:
   - `target=production`
   - optional `image_tag` (leave blank for HEAD SHA).
3. Watch logs through migration, container restart, readiness check.
4. Perform post-release validation:
   - auth endpoints
   - springs list/detail
   - meetup RSVP/chat
   - moderation endpoint list

## Rollback Procedure
Use previous known-good image tag.

1. Find prior successful `Build and Push API Image` run and copy tag.
2. Run `Deploy` workflow manually with:
   - `target=production`
   - `image_tag=<known-good-tag>`
3. Confirm `/ready` is healthy.
4. Re-run core smoke checks.

## Database Rollback
Current migration model uses a forward-only schema file (`db/schema.sql`).
If rollback requires schema change:
1. Restore database from latest snapshot backup.
2. Re-deploy known-good API image.
3. Re-validate critical flows.

## Incident Escalation
1. Declare incident and freeze merges.
2. Capture failing request IDs, error logs, and deploy run URL.
3. Decide fix-forward vs rollback within 15 minutes.
4. Post incident summary with timeline and remediation tasks.
