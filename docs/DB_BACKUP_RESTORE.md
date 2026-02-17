# DB Backup and Restore Verification

## Purpose
This runbook validates that a PostGIS database backup can be restored successfully.

## Local Verification Command
Run:

```bash
./scripts/verify_backup_restore.sh
```

The script:
1. Starts PostGIS via `db/docker-compose.postgis.yml`.
2. Loads `db/schema.sql`.
3. Seeds a deterministic record.
4. Creates a SQL backup with `pg_dump`.
5. Wipes the schema.
6. Restores from backup.
7. Verifies the seeded record exists.

## Environment Verification (Staging/Prod)
Run these manually during maintenance windows:
1. Take backup snapshot (`pg_dump` or managed DB snapshot).
2. Restore snapshot into isolated validation DB.
3. Run smoke query checks:
   - users count > 0
   - springs count > 0
   - sample auth and meetup rows present
4. Record run date, operator, and result in release notes.
