# Find A Spring - Product Requirements Document (PRD)

## 1. Document Control
- Product: Find A Spring (working title)
- Version: v0.1
- Date: February 16, 2026
- Owner: Product + Founding Team
- Status: Draft for implementation kickoff

## 2. Problem Statement
People who want to drink high-quality spring water struggle to:
- Discover nearby springs with reliable access details.
- Determine whether information is current and trustworthy.
- Coordinate refill trips with others safely.

Existing discovery options are fragmented, inconsistent, and often stale.

## 3. Vision
Build the most trusted spring water discovery and coordination platform, starting with discovery parity and then adding community-powered trip coordination.

## 4. Goals and Non-Goals
### Goals (MVP)
- Deliver core spring discovery and listing capabilities comparable to findaspring.org.
- Enable user-generated spring submissions with moderation controls.
- Provide clear safety disclaimers and reporting for incorrect data.

### Goals (Community v1, post-MVP)
- Let users organize spring trips together.
- Enable in-app communication for meetup coordination.
- Introduce basic trust and safety controls for user interactions.

### Non-Goals (for MVP + Community v1)
- Laboratory-grade certification guarantees.
- Advanced social graph features (feeds, stories, reactions).
- Full end-to-end encrypted messaging.
- Marketplace/commerce.

## 5. Personas
- Refill Regular: Frequently refills for self/household; values dependable access notes.
- Health Optimizer: Prioritizes water quality signals and freshness of information.
- Trip Host: Organizes group refill runs and wants safe, low-friction coordination.
- Moderator/Admin: Reviews submissions, resolves reports, prevents abuse.

## 6. User Stories
### MVP Discovery
- As a user, I can search and browse springs on a map by location.
- As a user, I can open a spring detail page with directions, coordinates, photos, and notes.
- As a user, I can submit a new spring listing for review.
- As a user, I can report inaccurate or unsafe listing information.
- As a user, I can save favorites.

### Community v1
- As a user, I can create a meetup at a spring with date/time, cap, and notes.
- As a user, I can RSVP to a meetup (going/maybe/waitlist).
- As a meetup participant, I can chat in the meetup thread.
- As a user, I can report another user or abusive message.
- As a host, I can remove participants from my meetup.

## 7. Scope
## 7.1 MVP In Scope
- Auth (email + OAuth optional)
- Spring map + search (geo + text)
- Spring details
- Spring submit flow
- Moderation queue for submissions
- Favorites
- Listing issue reports
- Core legal/safety disclaimers

## 7.2 Community v1 In Scope
- Meetups at springs
- RSVP states and capacity handling
- Meetup chat thread
- User block/report
- Host moderation actions (remove participant)

## 7.3 Out of Scope (for now)
- Real-time voice/video
- Complex reputation scoring
- Paid memberships
- Offline-first architecture

## 8. Functional Requirements
### FR-1 Discovery
- User can view springs on interactive map.
- User can filter/search by proximity and text.
- API returns paginated results sorted by distance.

### FR-2 Spring Detail
- Detail includes: coordinates, address/access notes, photos, latest status notes, disclaimer.

### FR-3 Submission & Moderation
- Users submit new spring or updates.
- Submissions enter moderation queue before publish/edit apply.
- Moderators can approve/reject with reason.

### FR-4 Reporting
- Users can report listing issues (access closed, location wrong, quality concern, duplicate).
- Reports visible in admin queue.

### FR-5 Favorites
- Authenticated users can save/remove favorite springs.

### FR-6 Meetups
- Users can create meetups tied to a spring.
- Meetup fields: title, description, start time, max attendees, visibility.

### FR-7 RSVP
- Users can RSVP going/maybe; system enforces capacity.
- Overflow becomes waitlist if enabled.

### FR-8 Meetup Chat
- Members can post/read messages in meetup thread.
- Basic moderation: delete message (host/admin), report message.

### FR-9 Safety Controls
- User block and user report actions available from profile/chat.

## 9. Non-Functional Requirements
- Availability target: 99.5% monthly for API.
- P95 API latency: < 400ms for read endpoints under normal load.
- Security baseline: OWASP top-10 mitigations, hashed passwords, RBAC for admin actions.
- Auditability: moderation and safety actions logged.
- Privacy: user location handled per consent policy.

## 10. Success Metrics
### MVP Metrics (first 90 days)
- Activation: >= 35% of new users perform spring search within first session.
- Contribution: >= 10% of active users submit update/listing/report.
- Data quality: median report resolution time < 72 hours.

### Community v1 Metrics (first 90 days post-launch)
- Meetup creation rate: >= 8% of weekly active users create/join a meetup.
- Chat participation: >= 60% of meetup participants send >= 1 message.
- Safety response SLA: 95% of user abuse reports triaged in < 24h.

## 11. Risks and Mitigations
- Risk: Stale or incorrect spring data.
  - Mitigation: freshness indicators, report workflows, moderation SLA.
- Risk: Safety incidents in community meetups.
  - Mitigation: reporting/blocking, host controls, clear safety guidance.
- Risk: Cold start in sparse geographies.
  - Mitigation: prioritize seeding known springs and contributor onboarding.

## 12. Release Criteria
### MVP Release Gate
- All P0 MVP endpoints and screens complete.
- Moderation/report queue functional.
- Disclaimers legally reviewed and visible.
- Basic telemetry dashboards live.

### Community v1 Release Gate
- Meetup + RSVP + chat fully functional.
- Abuse reporting, block, and host moderation functional.
- On-call/triage process documented.
