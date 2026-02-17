# Handoff - Find A Spring

## Snapshot
- Date: 2026-02-17
- Commit: `d4072ab`
- Branch: `main`
- Working tree: clean

## What is done

### Product/Planning docs
- `PRD.md`
- `TECH_SPEC.md`
- `ROADMAP.md`
- `BACKLOG.md`
- `DESIGN_SPEC.md`
- `UI_REQUIREMENTS.md`
- `FIGMA_STRUCTURE.md`
- `NO_FIGMA_DESIGN_WORKFLOW.md`

### Project scaffold
- Monorepo workspace with:
  - `apps/api`
  - `apps/mobile`
  - `packages/design-tokens`
  - `db/schema.sql`

### Backend implemented
- Auth:
  - `POST /v1/auth/signup`
  - `POST /v1/auth/login`
  - `POST /v1/auth/refresh`
  - `POST /v1/auth/logout`
  - `GET /v1/auth/me`
  - `POST /v1/auth/bootstrap-admin`
- Springs:
  - `GET /v1/springs`
  - `GET /v1/springs/:id`
  - `POST /v1/springs/submissions`
  - `POST /v1/springs/:id/reports`
  - `POST /v1/springs/:id/favorite`
  - `DELETE /v1/springs/:id/favorite`
- Community:
  - `POST /v1/meetups`
  - `GET /v1/meetups`
  - `GET /v1/meetups/:id`
  - `POST /v1/meetups/:id/rsvp`
  - `GET /v1/meetups/:id/messages`
  - `POST /v1/meetups/:id/messages`
  - `POST /v1/meetups/:id/remove-member`
  - `POST /v1/users/:id/block`
  - `POST /v1/users/:id/report`
- Moderation:
  - `GET /v1/moderation/submissions`
  - `POST /v1/moderation/submissions/:id/approve`
  - `POST /v1/moderation/submissions/:id/reject`
  - `GET /v1/moderation/reports`
  - `POST /v1/moderation/reports/:id/resolve`
  - `POST /v1/moderation/reports/:id/dismiss`
  - `GET /v1/moderation/user-reports`
  - `POST /v1/moderation/user-reports/:id/resolve`
  - `POST /v1/moderation/user-reports/:id/dismiss`

### Mobile implemented
- Discover:
  - API-backed spring list/search
  - map integration path (`react-native-maps`) + fallback
- Spring detail:
  - API-backed detail
  - favorite/unfavorite
- Account:
  - signup/login/signout
  - persistent session via AsyncStorage
  - session restore on app launch
- Meetups:
  - list/create/detail
  - RSVP
  - chat list/send
  - chat polling (8s)
  - optimistic send UX
  - quick report+block action

### Utilities/tests
- Moderator seed script:
  - `npm --workspace @findaspring/api run seed:moderator`
- Unit tests:
  - `apps/api/src/lib/passwords.test.js`
  - `apps/api/src/lib/tokens.test.js`
- Integration test scaffold:
  - `apps/api/test/meetups.integration.test.js`
  - skips unless `TEST_DATABASE_URL` is set

## Known gaps / next priorities
1. Run full end-to-end with installed deps and real Postgres/PostGIS.
2. Add robust API integration test harness (fixture setup/teardown and CI job).
3. Add mobile navigation structure (stack/tab router) instead of single-screen state switching.
4. Add dedicated moderation UI for user reports.
5. Replace chat polling with websocket realtime.
6. Harden auth/session security and production config.
7. Add CI pipeline for lint/typecheck/tests.

## Run checklist
1. Install deps:
   - `npm install`
2. Configure API env:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - optional `BOOTSTRAP_ADMIN_KEY`
3. Apply DB schema:
   - `psql "$DATABASE_URL" -f db/schema.sql`
4. Start API:
   - `npm run dev:api`
5. Start mobile:
   - `EXPO_PUBLIC_API_BASE_URL=http://localhost:4000 npm run dev:mobile`

## Suggested immediate task for next chat
- Implement CI + integration testing workflow:
  - Add GitHub Actions job with Postgres service + PostGIS
  - Run unit tests always
  - Run `meetups.integration.test.js` when `TEST_DATABASE_URL` is injected in CI
  - Add basic status badge and troubleshooting notes in README
