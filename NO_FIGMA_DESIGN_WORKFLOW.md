# No-Figma Design Workflow

You can ship this product without Figma by using a code-first design process.

## Source of truth
1. `DESIGN_SPEC.md` for principles and system rules.
2. `UI_REQUIREMENTS.md` for screen behavior and states.
3. `design/tokens.json` for implementation tokens.
4. `design/screens.yaml` for screen inventory and state coverage.

## Workflow
1. Define tokens in `design/tokens.json`.
2. Build reusable UI components directly in code.
3. Implement screens from `design/screens.yaml`.
4. Capture review screenshots from running app builds.
5. Approve via pull request with screenshot diffs.

## Review loop (without Figma)
- Every UI PR must include:
  - Before/after screenshots for changed screens.
  - Proof of loading/empty/error states.
  - Accessibility checks (labels, touch targets, contrast).

## Recommended implementation order
1. Discovery map
2. Spring detail
3. Submit/report flows
4. Favorites
5. Meetups
6. Meetup chat + safety actions

## Done criteria for each screen
- Matches token system.
- Has all required states.
- Mobile responsiveness verified.
- Accessibility checks pass.
