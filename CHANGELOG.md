# Changelog

All notable project changes should be documented here.

## Unreleased

### Added
- API Docker image build and deploy pipeline scaffold.
- PostGIS migration command and deployment runbooks.
- API request-id based structured logging.
- Scheduled uptime monitoring workflow.

### Changed
- Local PostGIS integration runner now waits for SQL readiness before testing.

### Fixed
- Local integration flake where PostGIS appeared healthy before accepting SQL connections.
