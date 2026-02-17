# Find A Spring - UI Requirements (Screen by Screen)

## 1. Scope
Defines required user interface behavior and states for:
- MVP Discovery
- Community v1 (meetups + chat)

## 2. Global UI Rules
- Every screen includes loading, empty, error, and offline states.
- Primary actions remain visible without excessive scrolling.
- Critical safety/legal text is always visible where relevant.
- All async actions provide immediate feedback and retry paths.

## 3. MVP Screens
## 3.1 Auth
Purpose: account access for favorites, submissions, and meetups.

Requirements:
- Email/password sign up + login.
- Password reset entry point.
- Inline validation and clear error copy.

States:
- Loading submit
- Invalid credentials
- Rate limited

## 3.2 Discover Map
Purpose: find nearby springs quickly.

Requirements:
- Map with spring pins.
- Search input (place/text).
- "Use my location" action.
- Bottom sheet list of matching springs.
- Filters: distance, status (active/unknown/closed).

States:
- Location permission denied
- No springs found
- Map load failure

Primary actions:
- Open spring detail
- Save spring (if logged in)

## 3.3 Spring Detail
Purpose: trusted spring decision page.

Requirements:
- Name, location, coordinates.
- Directions button to native maps app.
- Access notes and latest updates.
- Photo gallery.
- Persistent safety disclaimer.
- Actions: Save, Report issue, Create meetup (post-MVP gated).

States:
- Missing data fallback labels
- Report submitted confirmation

## 3.4 Submit Spring
Purpose: contribute new spring listing.

Requirements:
- Form fields: name, location pin, access notes, optional photos.
- Validation for required fields.
- Submission confirmation with pending moderation status.

States:
- Upload in progress
- Upload failed with retry
- Submission complete

## 3.5 Report Listing Issue
Purpose: correct inaccurate or unsafe spring records.

Requirements:
- Reason picker + optional details.
- Clear expectation: report goes to moderation review.
- Success state with ticket/reference ID.

States:
- Submit failure and retry
- Duplicate report warning (if recent existing report)

## 3.6 Saved / Favorites
Purpose: quick access to preferred springs.

Requirements:
- List/grid of favorited springs.
- Sort by distance and recent update.
- Remove from favorites.

States:
- Empty saved list with CTA to Discover.

## 4. Community v1 Screens
## 4.1 Meetups List
Purpose: discover upcoming trips.

Requirements:
- List by nearest/upcoming.
- Filters: date, distance, capacity available.
- Meetup cards with spring name, time, seats, host.

States:
- No meetups nearby
- RSVP required sign-in prompt

## 4.2 Meetup Detail
Purpose: decide and coordinate participation.

Requirements:
- Meetup info: title, spring, time, host, attendee cap.
- RSVP controls: Going, Maybe, Waitlist.
- Participant list.
- Entry to chat.

States:
- Full capacity -> waitlist option
- Cancelled meetup banner

## 4.3 Create/Edit Meetup
Purpose: host organization.

Requirements:
- Fields: title, date/time, capacity, description, visibility.
- Validation for date/time and cap bounds.
- Confirmation screen and share deeplink.

States:
- Past date/time validation error
- Edit restrictions once meetup starts

## 4.4 Meetup Chat
Purpose: in-context communication.

Requirements:
- Chronological messages with timestamps.
- Composer with send state and retry.
- Message actions: report, delete (host/admin).
- System messages for join/leave/remove events.

States:
- Reconnecting indicator
- Message send failed with retry
- Blocked user interaction prevented

## 4.5 Safety and Profile Actions
Purpose: prevent and handle abuse.

Requirements:
- Block user action from profile/chat.
- Report user action with reason categories.
- Confirmation and support messaging.

States:
- Already blocked
- Report submitted

## 5. Admin UI Requirements (Web)
## 5.1 Submissions Queue
- Filter by status/date.
- Review diff between existing listing and submission.
- Approve/reject with reason (required on reject).

## 5.2 Listing Reports Queue
- Filter by reason/severity.
- Resolve/dismiss with notes.
- Resolution timestamps and moderator identity.

## 5.3 User Reports Queue
- Show reported user, evidence, related chat context.
- Actions: warn, suspend, dismiss.
- Mandatory audit logging for all actions.

## 6. Telemetry Hooks (UI-level)
Track events:
- search_performed
- spring_viewed
- spring_saved
- spring_report_submitted
- meetup_created
- meetup_rsvp_changed
- chat_message_sent
- user_blocked
- user_report_submitted

## 7. QA Acceptance Checklist
- Key flows pass on small and large mobile screens.
- Keyboard and safe area behavior verified.
- Accessibility labels verified for actionable elements.
- Empty/error/loading states validated for each screen.
- Legal disclaimer placement verified on spring detail.
