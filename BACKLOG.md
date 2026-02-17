# Find A Spring - Prioritized Backlog

## Estimation Scale
- S: <= 2 days
- M: 3-5 days
- L: 6-10 days

## P0 - Foundation and MVP
1. `INF-001` Project scaffolding, linting, formatting, CI pipeline (M)
- Dependencies: none
- Acceptance: PR checks run on push and block failing merges.

2. `INF-002` Postgres + PostGIS setup with migration framework (M)
- Dependencies: INF-001
- Acceptance: migrations run in local + CI + staging.

3. `AUTH-001` User auth (email/password, JWT access/refresh) (L)
- Dependencies: INF-001
- Acceptance: sign up, login, refresh, logout endpoints and tests.

4. `SPR-001` Springs schema and geospatial query endpoint (L)
- Dependencies: INF-002
- Acceptance: `GET /v1/springs` supports radius and text query.

5. `SPR-002` Spring detail endpoint (M)
- Dependencies: SPR-001
- Acceptance: `GET /v1/springs/:id` returns required fields.

6. `APP-001` Mobile map screen with spring pins + search by location (L)
- Dependencies: SPR-001
- Acceptance: user can search and open spring details from map.

7. `APP-002` Spring detail screen with directions/media/notes/disclaimer (M)
- Dependencies: SPR-002
- Acceptance: disclaimer always visible and directions open native maps.

8. `SUB-001` Submit spring flow (API + UI) (L)
- Dependencies: AUTH-001, SPR-001
- Acceptance: submission stored as pending moderation.

9. `MOD-001` Moderation queue for submissions with approve/reject actions (M)
- Dependencies: SUB-001
- Acceptance: moderator can change submission status with audit trail.

10. `REP-001` Listing issue report flow (API + UI + admin queue) (M)
- Dependencies: AUTH-001, SPR-001
- Acceptance: report triage statuses available in admin panel.

11. `FAV-001` Favorites save/remove + favorites list screen (M)
- Dependencies: AUTH-001, SPR-001
- Acceptance: favorites persist per user and sync across sessions.

12. `OBS-001` Logging, metrics, error tracking baseline (M)
- Dependencies: INF-001
- Acceptance: API error rates and key endpoint latencies visible.

## P1 - Community v1
13. `COM-001` Meetups schema + create/list/detail endpoints (L)
- Dependencies: AUTH-001, SPR-001
- Acceptance: meetups linked to spring and host.

14. `COM-002` RSVP endpoint with capacity + waitlist logic (M)
- Dependencies: COM-001
- Acceptance: over-capacity users are placed on waitlist when enabled.

15. `APP-003` Meetup creation and RSVP UI (L)
- Dependencies: COM-001, COM-002
- Acceptance: user can create meetup and RSVP from spring detail.

16. `CHAT-001` Realtime chat transport and message persistence (L)
- Dependencies: COM-001
- Acceptance: meetup members exchange messages with reconnect support.

17. `CHAT-002` Meetup chat UI + pagination + send states (M)
- Dependencies: CHAT-001
- Acceptance: send/read works under network interruptions.

18. `SAFE-001` User block/report APIs and moderation queue integration (M)
- Dependencies: AUTH-001
- Acceptance: blocked users cannot interact in chat contexts.

19. `SAFE-002` Host moderation actions (remove member, delete message) (M)
- Dependencies: COM-001, CHAT-001
- Acceptance: host actions enforced by authorization checks.

20. `SAFE-003` Abuse rate limiting + basic spam heuristics (M)
- Dependencies: CHAT-001
- Acceptance: repeated abuse patterns throttled and logged.

## P2 - Trust/Growth Enhancements
21. `QUAL-001` Water test result schema and display module (L)
- Dependencies: SPR-002
- Acceptance: tests show date/source/metrics with freshness badge.

22. `NOTIF-001` Push notifications for meetup reminders and updates (M)
- Dependencies: COM-001
- Acceptance: users receive reminder at configurable lead time.

23. `REP-002` Lightweight reputation indicators on profiles (M)
- Dependencies: COM-001, SAFE-001
- Acceptance: profile shows contributions and meetup participation.

24. `ANA-001` Product analytics events and funnel dashboards (M)
- Dependencies: OBS-001
- Acceptance: activation and community conversion funnels available.

## Suggested Sprint Cut
- Sprint 1: INF-001, INF-002, AUTH-001
- Sprint 2: SPR-001, SPR-002, APP-001
- Sprint 3: APP-002, SUB-001, MOD-001
- Sprint 4: REP-001, FAV-001, OBS-001
- Sprint 5: COM-001, COM-002, APP-003
- Sprint 6: CHAT-001, CHAT-002, SAFE-001
- Sprint 7: SAFE-002, SAFE-003, hardening + release prep
