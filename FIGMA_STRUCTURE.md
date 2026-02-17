# Find A Spring - Figma Structure and Naming Conventions

## 1. Purpose
Define a consistent Figma workspace structure so product, design, and engineering can collaborate without ambiguity.

## 2. File Strategy
Use one primary product file for active design plus one shared library file.

- Product file: `Find A Spring - Product`
- Library file: `Find A Spring - Design System`

## 3. Product File Pages
Use this exact order:

1. `00_Cover`
2. `01_Foundations_Refs`
3. `02_User_Flows`
4. `03_Wireframes_MVP`
5. `04_HiFi_MVP`
6. `05_Prototype_MVP`
7. `06_Wireframes_Community`
8. `07_HiFi_Community`
9. `08_Prototype_Community`
10. `09_Admin_Moderation`
11. `10_Archive`

## 4. Design System File Pages
1. `00_Foundations`
2. `01_Icons`
3. `02_Components_Core`
4. `03_Components_Composite`
5. `04_Patterns`
6. `05_Content_Style`
7. `06_Changelog`

## 5. Frame Naming Convention
Format:
`[Platform]_[Area]_[Screen]_[State]_[Version]`

Examples:
- `iOS_Discover_Map_Default_v1`
- `iOS_SpringDetail_Default_v1`
- `iOS_MeetupChat_Reconnecting_v1`
- `Web_Admin_SubmissionsQueue_Default_v1`

Rules:
- Platform values: `iOS`, `Android`, `Web`.
- State values: `Default`, `Loading`, `Empty`, `Error`, `Offline`, `Success`.
- Version suffix required for iterative revisions.

## 6. Component Naming Convention
Format:
`[Category]/[Component]/[Variant]/[State]`

Examples:
- `Button/Primary/Large/Default`
- `Button/Primary/Large/Pressed`
- `Input/Text/Default/Error`
- `Card/Spring/Compact/Default`
- `Badge/Status/Active/Default`

Rules:
- Keep categories stable: `Button`, `Input`, `Card`, `Badge`, `Chip`, `Nav`, `Sheet`, `ListItem`, `Message`.
- Variants represent size/type, not state.
- State always last.

## 7. Token Naming Convention
Use semantic tokens aligned to engineering names.

- Color: `color.bg.primary`, `color.text.primary`, `color.action.primary`
- Spacing: `space.4`, `space.8`, `space.12`, `space.16`, `space.24`
- Radius: `radius.12`, `radius.16`
- Typography: `type.h1`, `type.body`, `type.caption`

Rule:
- Never use raw hex or pixel values directly in components when a token exists.

## 8. MVP Screen Inventory (Required)
- `Auth_Login`
- `Auth_Signup`
- `Discover_Map`
- `Discover_SearchResultsSheet`
- `SpringDetail`
- `SubmitSpring_Form`
- `SubmitSpring_Success`
- `ReportIssue_Form`
- `Saved_List`

Each screen must include at minimum:
- Default
- Loading
- Empty (where relevant)
- Error

## 9. Community v1 Screen Inventory (Required)
- `Meetups_List`
- `Meetup_Detail`
- `Meetup_Create`
- `Meetup_Chat`
- `UserProfile_SafetyActions`

Required state coverage:
- RSVP capacity full
- Waitlist active
- Chat reconnecting
- Block/report confirmation

## 10. Annotation and Handoff Rules
Add a `Spec` section to each final frame including:
- Spacing/redline callouts.
- Typography style references.
- Interaction notes (tap behavior, transitions).
- Data dependencies (fields required from API).
- Edge-case notes.

Use a consistent annotation tag prefix:
- `SPEC:` functional behavior
- `A11Y:` accessibility requirements
- `DATA:` API/data contract notes

## 11. Prototype Conventions
- Build one primary user journey prototype per milestone.

MVP prototype path:
`Discover_Map -> SpringDetail -> Save/Report`

Community v1 prototype path:
`SpringDetail -> Meetup_Create -> RSVP -> Meetup_Chat`

## 12. Versioning and Change Control
- Duplicate and increment frame version for major revisions.
- Log significant changes in `06_Changelog` page in design system file.
- Engineering handoff occurs only on frames tagged `READY_FOR_DEV`.

## 13. Dev Handoff Checklist
Before implementation, confirm:
- Frame is tagged `READY_FOR_DEV`.
- All component variants are published from library.
- Tokens used (no raw overrides).
- States covered (loading/empty/error/offline).
- Specs include interaction and API notes.
- Accessibility notes present for critical actions.
