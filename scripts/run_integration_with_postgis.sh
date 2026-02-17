#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/db/docker-compose.postgis.yml"
COMPOSE_CMD=(docker compose -f "$COMPOSE_FILE")

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required. Install Docker Desktop, then re-run this script."
  exit 1
fi

cleanup() {
  "${COMPOSE_CMD[@]}" down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Starting PostGIS test database..."
"${COMPOSE_CMD[@]}" up -d

echo "Waiting for PostGIS healthcheck..."
for _ in {1..60}; do
  if "${COMPOSE_CMD[@]}" ps --format json | grep -q '"Health":"healthy"'; then
    break
  fi
  sleep 2
done

if ! "${COMPOSE_CMD[@]}" ps --format json | grep -q '"Health":"healthy"'; then
  echo "PostGIS did not become healthy in time."
  exit 1
fi

export TEST_DATABASE_URL='postgresql://postgres:postgres@localhost:55432/findaspring_test'
export AUTH_SECRET='local-integration-secret'
export BOOTSTRAP_ADMIN_KEY='local-bootstrap-key'

echo "Running meetup integration test..."
cd "$REPO_ROOT"
npm --workspace @findaspring/api run test:integration
