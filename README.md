# Find A Spring
[![CI](https://github.com/mmdevon/findaspring/actions/workflows/ci.yml/badge.svg)](https://github.com/mmdevon/findaspring/actions/workflows/ci.yml)

Codebase scaffold for MVP + community roadmap.

## Workspace layout
- `apps/mobile`: React Native (Expo) app scaffold
- `apps/api`: Node API scaffold
- `packages/design-tokens`: shared design tokens
- `db/schema.sql`: PostgreSQL/PostGIS schema
- `design/`: design source files (no-Figma workflow)

## Getting started
1. Install dependencies:
```bash
npm install
```
2. Start mobile app:
```bash
npm run dev:mobile
```
3. Start API:
```bash
npm run dev:api
```

## API environment
Set these before starting API:

```bash
export PORT=4000
export DATABASE_URL='postgres://user:pass@localhost:5432/findaspring'
export AUTH_SECRET='replace-with-strong-secret'
```

Optional:

```bash
export ACCESS_TOKEN_TTL_SEC=900
export REFRESH_TOKEN_TTL_SEC=2592000
export BOOTSTRAP_ADMIN_KEY='one-time-bootstrap-key'
```

If `DATABASE_URL` is missing:
- `GET /v1/springs`, `GET /v1/springs/:id`, and `GET /v1/meetups` return sample/demo data.
- write/auth/moderation endpoints return `503`.

## Current API routes
Public:
- `GET /health`
- `GET /v1/springs?lat=&lng=&radius_km=&q=&page=&page_size=`
- `GET /v1/springs/:id`
- `GET /v1/meetups?spring_id=&from=`
- `GET /v1/meetups/:id`
- `GET /v1/meetups/:id/messages?cursor=`

Auth:
- `POST /v1/auth/signup`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `GET /v1/auth/me`
- `POST /v1/auth/bootstrap-admin` (requires `x-bootstrap-key` header, only works before any admin exists)

MVP protected:
- `POST /v1/springs/submissions`
- `POST /v1/springs/:id/reports`
- `POST /v1/springs/:id/favorite`
- `DELETE /v1/springs/:id/favorite`

Community protected:
- `POST /v1/meetups`
- `POST /v1/meetups/:id/rsvp`
- `POST /v1/meetups/:id/messages`
- `POST /v1/meetups/:id/remove-member`
- `POST /v1/users/:id/block`
- `POST /v1/users/:id/report`

Moderation (moderator/admin):
- `GET /v1/moderation/submissions?status=pending`
- `POST /v1/moderation/submissions/:id/approve`
- `POST /v1/moderation/submissions/:id/reject`
- `GET /v1/moderation/reports?status=open`
- `POST /v1/moderation/reports/:id/resolve`
- `POST /v1/moderation/reports/:id/dismiss`
- `GET /v1/moderation/user-reports?status=open`
- `POST /v1/moderation/user-reports/:id/resolve`
- `POST /v1/moderation/user-reports/:id/dismiss`

## Moderator seed script
Create or update a moderator/admin from CLI:

```bash
export DATABASE_URL='postgres://user:pass@localhost:5432/findaspring'
export MODERATOR_EMAIL='mod@example.com'
export MODERATOR_DISPLAY_NAME='Spring Moderator'
export MODERATOR_PASSWORD='change-me-strong'
export MODERATOR_ROLE='moderator' # or admin
npm --workspace @findaspring/api run seed:moderator
```

## Mobile environment
Set mobile API URL for device/simulator:

```bash
export EXPO_PUBLIC_API_BASE_URL='http://localhost:4000'
```

Optional initial token override:

```bash
export EXPO_PUBLIC_AUTH_BEARER_TOKEN='<access_token>'
```

Use your machine LAN IP instead of localhost when testing on physical devices.

## Mobile auth persistence
- Account tab login/signup persists auth session in `AsyncStorage`.
- On app launch, session is restored automatically and revalidated via `/v1/auth/me`.

## Database bootstrap
Run schema in Postgres (with PostGIS enabled):

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

## CI
- Workflow: `.github/workflows/ci.yml`
- Triggers: pushes to `main` and all pull requests
- Jobs run in parallel (when relevant paths change):
  - `Lint`: runs `npm run lint`
  - `Typecheck`: runs `npm run typecheck`
  - `Unit Tests`: runs `npm --workspace @findaspring/api run test:unit`
  - `Integration Tests (PostGIS)`: starts `postgis/postgis:16-3.4`, injects `TEST_DATABASE_URL`, and runs `npm --workspace @findaspring/api run test:integration`
- Path filters:
  - API/DB/workflow changes trigger API unit + integration jobs.
  - Mobile/design-tokens/TS config changes trigger typecheck.
  - Code/workflow changes trigger lint.

### CI troubleshooting
- Badge URL placeholder:
  - If you fork/rename the repo, update the badge/link URL above.
- Integration tests are skipped locally:
  - Ensure `TEST_DATABASE_URL` is set before running `npm --workspace @findaspring/api run test:integration`.
- PostGIS errors such as `type "geography" does not exist`:
  - Confirm `CREATE EXTENSION IF NOT EXISTS postgis;` can run and that the database user has extension privileges.
- DB connection failures in CI:
  - Confirm `TEST_DATABASE_URL` points to `localhost:5432` with the same DB/user/password configured in the workflow service.

## Notes
- Mobile theme is wired to shared tokens from `packages/design-tokens`.
- Discover screen renders `react-native-maps` pins on iOS/Android with a fallback panel when unavailable.
- Account tab supports sign up/login and in-app token session handling.
- Meetups screen supports list/create/detail, RSVP, chat polling with optimistic send, and basic report/block actions.
