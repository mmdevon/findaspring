# Find A Spring - Technical Specification

## 1. Overview
This spec defines the architecture and implementation plan for:
- Phase 1: Spring discovery parity MVP.
- Phase 2: Community v1 (meetups + chat + safety controls).

## 2. System Architecture
- Client Apps:
  - Mobile app: React Native (iOS/Android)
  - Optional web admin: React + TypeScript
- API Layer:
  - Node.js + TypeScript (NestJS or Express + Zod)
  - REST JSON APIs (versioned under `/v1`)
- Data Layer:
  - PostgreSQL 16 + PostGIS extension
  - Redis (optional) for caching/session/realtime presence
- Realtime:
  - WebSocket gateway for meetup chat (or managed pub/sub)
- Storage:
  - S3-compatible object storage for images/uploads
- Auth:
  - JWT access + refresh token flow
  - OAuth providers optional in v1
- Observability:
  - OpenTelemetry traces
  - Structured logs + metrics dashboard

## 3. Data Model
## 3.1 Core Entities (MVP)
- users
- springs
- spring_photos
- spring_submissions
- spring_reports
- favorites
- moderation_events

## 3.2 Community Entities (v1)
- meetups
- meetup_members
- meetup_messages
- user_blocks
- user_reports

## 3.3 Suggested Schema (key fields)
### users
- id (uuid, pk)
- email (unique)
- password_hash
- display_name
- role (`user|moderator|admin`)
- created_at, updated_at

### springs
- id (uuid, pk)
- name
- slug (unique)
- location (geography(Point, 4326))
- country, region, city
- access_notes
- status (`active|closed_temp|closed_perm|unknown`)
- verified_at
- created_by
- created_at, updated_at

Indexes:
- GIST index on `location`
- btree on `status`, `updated_at`

### spring_submissions
- id, spring_id (nullable for new)
- submitted_by
- payload_json
- status (`pending|approved|rejected`)
- moderator_id (nullable)
- decision_reason
- created_at, reviewed_at

### spring_reports
- id, spring_id, reported_by
- reason (`wrong_location|access_issue|quality_concern|duplicate|other`)
- details
- status (`open|triaged|resolved|dismissed`)
- created_at, resolved_at

### favorites
- user_id, spring_id
- created_at
- unique(user_id, spring_id)

### meetups
- id, spring_id, host_user_id
- title
- description
- start_time
- max_attendees
- visibility (`public|friends_only`)
- status (`scheduled|cancelled|completed`)
- created_at, updated_at

### meetup_members
- meetup_id, user_id
- rsvp_status (`going|maybe|waitlist|left|removed`)
- role (`host|member`)
- joined_at
- unique(meetup_id, user_id)

### meetup_messages
- id, meetup_id, user_id
- body
- is_deleted (bool default false)
- created_at

### user_blocks
- blocker_user_id, blocked_user_id
- created_at
- unique(blocker_user_id, blocked_user_id)

### user_reports
- id
- reporter_user_id
- target_user_id
- target_message_id (nullable)
- reason (`harassment|spam|hate|impersonation|other`)
- details
- status (`open|triaged|resolved|dismissed`)
- created_at, resolved_at

## 4. API Design
## 4.1 MVP Endpoints
- `GET /v1/springs?lat=&lng=&radius_km=&q=&page=`
- `GET /v1/springs/:id`
- `POST /v1/springs/submissions`
- `POST /v1/springs/:id/reports`
- `POST /v1/springs/:id/favorite`
- `DELETE /v1/springs/:id/favorite`

Moderation (admin/moderator):
- `GET /v1/moderation/submissions?status=pending`
- `POST /v1/moderation/submissions/:id/approve`
- `POST /v1/moderation/submissions/:id/reject`
- `GET /v1/moderation/reports?status=open`

## 4.2 Community v1 Endpoints
- `POST /v1/meetups`
- `GET /v1/meetups?spring_id=&from=`
- `GET /v1/meetups/:id`
- `POST /v1/meetups/:id/rsvp`
- `POST /v1/meetups/:id/messages`
- `GET /v1/meetups/:id/messages?cursor=`
- `POST /v1/users/:id/block`
- `POST /v1/users/:id/report`
- `POST /v1/meetups/:id/remove-member`

## 5. Authorization
- RBAC roles: `user`, `moderator`, `admin`.
- Only moderators/admins can process submissions/reports.
- Meetup hosts can remove members in their meetup.
- Blocked relationships prevent direct interaction/chat visibility.

## 6. Realtime Chat
- Transport: WebSocket channels per `meetup_id`.
- Server enforces membership before subscribe/send.
- Message persistence in PostgreSQL; optimistic client render.
- Rate limiting: e.g., 10 messages / 15 seconds per user.

## 7. Trust and Safety
- All report actions create auditable events.
- Abuse triage queue for `user_reports` and `reported_messages`.
- Soft delete for messages to preserve moderation evidence.
- Keyword/URL spam heuristics in message ingestion pipeline.

## 8. Security Requirements
- Password hashing with Argon2id.
- Short-lived access tokens + rotating refresh tokens.
- Input validation with schema library (Zod/Joi).
- Parameterized queries only (ORM or query builder).
- Audit logs for moderation decisions.
- Enforce HTTPS and secure cookie/token transport.

## 9. Performance and Scaling
- Spatial query optimization with PostGIS GIST indexes.
- CDN for image assets.
- Read endpoints cache (short TTL where acceptable).
- Cursor pagination for chat/messages.

## 10. Deployment
- Environments: dev, staging, production.
- CI pipeline:
  - lint + typecheck + unit tests
  - migration checks
  - integration smoke tests
- CD: staged rollout with rollback support.

## 11. Testing Strategy
- Unit tests for domain logic and validators.
- Integration tests for API endpoints + DB interactions.
- E2E tests for critical user journeys:
  - search -> spring detail -> report
  - submit listing -> moderation approve
  - create meetup -> RSVP -> chat -> report user

## 12. Open Decisions
- Map provider final choice (Mapbox vs Google Maps).
- Realtime infra choice (self-hosted ws vs managed).
- OAuth providers included in MVP or deferred.
