# Release Checklist

## Before Cut
1. Confirm all required CI checks are green on `main`.
2. Confirm staging deploy is green and `/ready` passes.
3. Confirm no unresolved P0/P1 issues remain for this release.
4. Confirm rollback owner and on-call owner are assigned.

## Changelog Update
1. Open `/CHANGELOG.md`.
2. Add a new top section for the release date/version.
3. Summarize user-visible changes under:
   - Added
   - Changed
   - Fixed
4. Link merged PRs where possible.

## Production Release
1. Trigger `.github/workflows/deploy.yml` with `target=production`.
2. Monitor migration step and readiness check.
3. Validate:
   - `GET /health`
   - `GET /ready`
   - signup/login
   - springs list/detail
   - meetup RSVP/message

## After Release
1. Add final release entry to `/CHANGELOG.md`.
2. Post release summary in team channel with commit SHA and run URL.
3. Open follow-up issues for any deferred fixes.
