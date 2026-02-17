# Build, Test, and Deploy Plan

## Assumptions
1. Stack remains React Native (Expo) mobile + Node API + Postgres/PostGIS.
2. CI baseline in `.github/workflows/ci.yml` remains active.
3. `main` stays branch-protected and PR-based.

## Progress Tracker
- [x] CI pipeline with PostGIS-backed integration testing is active.
- [x] Branch protection and PR-based workflow are active.
- [x] Local PostGIS integration script runs and passes non-skip integration test.
- [x] Mobile navigation refactor (tab + stack behavior) implemented.
- [x] Mobile moderation user-reports screen implemented.
- [x] Realtime meetup chat over WebSocket implemented (API + mobile client).
- [x] Mobile test framework and first smoke flow implemented.
- [x] API containerization and readiness checks implemented.
- [x] Migration automation wired into deploy workflow.
- [x] CI/CD deploy workflow for staging + production added.
- [x] Release and rollback runbook documented.
- [x] Structured API logging and request tracing added.
- [x] Uptime monitor workflow added.
- [x] Release checklist and changelog process documented.
- [x] Local DB backup/restore verification drill automated.
- [x] Mobile release pipeline scaffolded with EAS profiles and workflow.
- [x] API integration suites expanded for auth/springs/moderation and failure paths.
- [ ] Staging infrastructure secrets/host provisioning completed.
- [ ] First successful staging deployment executed.
- [ ] Backup/restore verification executed on staging/prod data.
- [ ] Production hardening and release operations completed end-to-end.

## Phase 1: Product Hardening (Weeks 1-2)
1. Finalize API contracts for auth, springs, meetups, moderation.
2. Add mobile navigation architecture (tabs + stacks) and route guards.
3. Implement moderation UI for user reports.
4. Replace chat polling with websocket realtime on API and mobile.
5. Harden auth/session configuration for production (token TTLs, secret handling).

## Phase 2: Testing Expansion (Weeks 2-4)
1. Expand API unit tests to route and service layers.
2. Add API integration suites for auth, springs, moderation, and failure paths.
3. Add mobile component tests (React Native Testing Library) for core screens.
4. Add mobile E2E smoke tests (Detox or Maestro) for signup/login/discover/meetups.
5. Add contract tests between mobile client and API responses.
6. Add load tests for key endpoints (`/v1/springs`, `/v1/meetups`, auth).

## Phase 3: Deployment Foundation (Weeks 3-5)
1. Add API containerization (`Dockerfile`) and readiness/health probes.
2. Provision `staging` and `production` environments (API + PostGIS + secrets).
3. Add migration workflow to run schema changes before rollout.
4. Add CD pipeline: auto-deploy to staging on merge, manual promotion to prod.
5. Add mobile release pipeline with Expo EAS profiles (preview/staging/prod).

## Phase 4: Release Operations (Weeks 5-6)
1. Add observability (structured logs, error tracking, uptime checks, alerts).
2. Create runbooks for incidents, rollback, DB restore, and secret rotation.
3. Verify backup/restore for Postgres/PostGIS.
4. Add release checklist and changelog process.

## Quality Gates (Pre-Production)
1. CI green on lint, typecheck, unit, smoke, and integration.
2. API integration suite passes against real PostGIS in CI.
3. Mobile E2E smoke tests pass on at least one iOS and one Android target.
4. Staging soak period of 48-72 hours with no critical errors.
5. Rollback path tested for API and DB migration.

## Immediate Next 7 Days
1. [x] Implement navigation refactor and moderation UI.
2. [x] Add websocket chat backend + mobile client switch.
3. [x] Add mobile test framework and first smoke flow.
4. [ ] Stand up staging API + PostGIS and run first staging deploy.
5. [x] Document release/rollback runbook in repo docs.
6. [x] Add structured API logs + uptime monitor workflow.
7. [x] Add release checklist + changelog baseline.
8. [x] Add mobile release workflow with EAS profiles.
9. [x] Expand API integration coverage beyond meetups flow.
