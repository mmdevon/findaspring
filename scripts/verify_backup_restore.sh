#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/db/docker-compose.postgis.yml"
COMPOSE_CMD=(docker compose -f "$COMPOSE_FILE")
CONTAINER_NAME="findaspring-postgis-test"
DB_NAME="findaspring_test"
BACKUP_FILE="$(mktemp -t findaspring-backup-XXXXXX.sql)"
SCHEMA_FILE="$(mktemp -t findaspring-schema-XXXXXX.sql)"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required. Install Docker Desktop, then re-run this script."
  exit 1
fi

cleanup() {
  rm -f "$BACKUP_FILE"
  rm -f "$SCHEMA_FILE"
  "${COMPOSE_CMD[@]}" down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

run_psql() {
  local sql="$1"
  for _ in {1..30}; do
    if docker exec "$CONTAINER_NAME" psql -U postgres -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "$sql" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  docker exec "$CONTAINER_NAME" psql -U postgres -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "$sql" >/dev/null
}

run_psql_file() {
  local file="$1"
  for _ in {1..30}; do
    if cat "$file" | docker exec -i "$CONTAINER_NAME" psql -U postgres -d "$DB_NAME" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  cat "$file" | docker exec -i "$CONTAINER_NAME" psql -U postgres -d "$DB_NAME" >/dev/null
}

echo "Starting PostGIS database..."
"${COMPOSE_CMD[@]}" up -d

echo "Waiting for PostGIS to become healthy..."
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

echo "Waiting for SQL readiness..."
for _ in {1..30}; do
  if docker exec "$CONTAINER_NAME" psql -U postgres -d "$DB_NAME" -c 'SELECT 1' >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! docker exec "$CONTAINER_NAME" psql -U postgres -d "$DB_NAME" -c 'SELECT 1' >/dev/null 2>&1; then
  echo "PostGIS is not accepting SQL connections."
  exit 1
fi

echo "Loading schema..."
sed '/CREATE EXTENSION IF NOT EXISTS postgis;/d' "$REPO_ROOT/db/schema.sql" > "$SCHEMA_FILE"
run_psql_file "$SCHEMA_FILE"

echo "Seeding verification record..."
run_psql \
  "INSERT INTO users (id, email, password_hash, display_name, role)
   VALUES ('11111111-1111-1111-1111-111111111111', 'restore@example.com', 'hash', 'Restore User', 'user')
   ON CONFLICT (email) DO UPDATE SET updated_at = NOW();"
run_psql \
  "INSERT INTO springs (id, name, slug, status, location, city, region, created_by)
   VALUES (
     '22222222-2222-2222-2222-222222222222',
     'Restore Verification Spring',
     'restore-verification-spring',
     'active',
     ST_SetSRID(ST_MakePoint(-86.9, 36.0), 4326)::geography,
     'Columbia',
     'TN',
     '11111111-1111-1111-1111-111111111111'
   )
   ON CONFLICT (id) DO UPDATE SET updated_at = NOW();"

echo "Creating SQL backup..."
docker exec "$CONTAINER_NAME" pg_dump -U postgres --clean --if-exists -d "$DB_NAME" > "$BACKUP_FILE"

echo "Wiping schema..."
run_psql "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "Restoring backup..."
cat "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U postgres -d "$DB_NAME" >/dev/null

echo "Verifying restored record..."
RESTORED_COUNT=$(docker exec "$CONTAINER_NAME" psql -U postgres -d "$DB_NAME" -At -c \
  "SELECT COUNT(*) FROM springs WHERE id = '22222222-2222-2222-2222-222222222222';")

if [[ "$RESTORED_COUNT" != "1" ]]; then
  echo "Backup restore verification failed. Expected 1 restored spring, got $RESTORED_COUNT."
  exit 1
fi

echo "Backup/restore verification passed."
