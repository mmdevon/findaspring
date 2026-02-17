# Find A Spring - Design Specification

## 1. Document Control
- Product: Find A Spring
- Version: v0.1
- Date: February 16, 2026
- Owner: Product Design
- Status: Draft

## 2. Design Goals
- Trustworthy: convey safety, reliability, and clarity.
- Field-ready: optimized for outdoor, mobile, low-attention usage.
- Community-centered: make group coordination easy without social noise.
- Calm utility: practical and clean, not gamified clutter.

## 3. Brand Direction
- Tone: grounded, practical, nature-forward.
- Personality: dependable, local, community-powered.
- Visual metaphor: natural spring flow + topographic navigation.

## 4. Visual System
## 4.1 Color Tokens (initial)
- `--color-bg-primary`: warm off-white
- `--color-bg-secondary`: soft stone
- `--color-text-primary`: charcoal
- `--color-text-secondary`: slate
- `--color-accent-primary`: spring blue
- `--color-accent-secondary`: moss green
- `--color-success`: deep green
- `--color-warning`: amber
- `--color-danger`: brick red

Usage rules:
- Reserve accent colors for actions, map highlights, and state badges.
- Use warning/danger only for risk and moderation/safety contexts.
- Maintain WCAG AA contrast for text and actionable controls.

## 4.2 Typography
- Heading font: expressive serif or humanist display for place identity.
- Body/UI font: highly legible sans-serif for utility and dense info.
- Type scale:
  - Display
  - H1
  - H2
  - Body Large
  - Body
  - Caption

Usage rules:
- Spring names and location titles can use stronger typographic emphasis.
- Navigation labels and metadata prioritize legibility over style.

## 4.3 Spacing and Layout
- Base spacing unit: 4pt.
- Core scale: 4, 8, 12, 16, 24, 32.
- Default mobile screen padding: 16.
- Card radius: 12 (content cards), 16 (feature cards).

## 4.4 Iconography and Imagery
- Icons: simple line icons with filled active states.
- Photography: natural-light, factual imagery preferred over stylized filters.
- Avoid stock-heavy hero visuals; prioritize real spring user photos.

## 4.5 Motion
- Purposeful, subtle transitions only:
  - Map -> detail sheet transitions
  - RSVP state changes
  - Chat send/receive feedback
- Duration target: 150-250ms for most UI motion.
- Avoid decorative or continuous animations in primary workflows.

## 5. Component System
## 5.1 Core Components
- Buttons: primary, secondary, ghost, destructive.
- Inputs: text, multiline, picker, date/time, segmented control.
- Cards: spring card, meetup card, report card.
- Badges: status, freshness, moderation state.
- Chips: filters and quick toggles.
- Bottom sheet: map result details and quick actions.
- List rows: compact metadata + action affordance.

## 5.2 State Definitions
Every component must define:
- Default
- Pressed/hover/focus (platform-appropriate)
- Disabled
- Error (if input/actionable)
- Loading (if async)

## 6. Accessibility Requirements
- WCAG 2.2 AA baseline.
- Dynamic type support on mobile.
- Screen reader labels on all icon-only actions.
- Touch targets >= 44x44pt.
- Color must not be the sole indicator of status.

## 7. Information Architecture
Top-level app navigation:
- Discover
- Meetups
- Saved
- Inbox (notifications/messages)
- Profile

Admin/moderation (web preferred):
- Submissions queue
- Listing reports
- User reports
- Moderation audit log

## 8. Design for Trust and Safety
- Persistent, concise safety disclaimer on spring detail.
- Freshness timestamp on spring updates and quality notes.
- Clear report/block paths in chat and profile.
- Confirmation modals for host moderation actions.

## 9. Deliverables by Milestone
## MVP Deliverables
- Design tokens v1 (color/type/spacing).
- Core component library v1.
- High-fidelity screens:
  - Auth
  - Discover map + search
  - Spring detail
  - Submit spring
  - Report listing
  - Favorites

## Community v1 Deliverables
- Meetup creation/edit flows.
- RSVP states and participant management.
- Meetup chat and safety actions.
- User report/block UX.

## 10. Handoff Requirements
- Figma file with components and screen variants.
- Token export map (design token -> code token names).
- Redlines for spacing, typography, and interaction states.
- Edge-case annotations (empty, loading, offline, error).

## 11. Acceptance Criteria
- Engineering implementation matches design tokens and states.
- All P0 screens have complete empty/loading/error states.
- Accessibility checklist passes for key workflows.
- Usability test (5 users) validates search -> spring detail -> save/report flow.
