# PostgreSQL Database Synchronization

## Overview

This document covers how to synchronize PostgreSQL databases across different environments: server-to-server, local-to-server, server-to-local, and local-to-local.

The core workflow is always the same: **dump → transfer → restore**. PostgreSQL's `pg_dump` creates a portable snapshot of a database; `pg_restore` (or `psql`) loads it into a target. The transfer step (e.g. `scp`) only applies when source and target are on different machines.

### Why Custom Format?

Use `pg_dump -Fc` (custom format) over plain SQL dumps wherever possible. Custom format is compressed, supports parallel restore, and allows selective object restoration. Plain SQL dumps are fine for simple cases but become unwieldy at scale.

### Excluded Tables

Spatial metadata tables (`spatial_ref_sys`, `geography_columns`, `geometry_columns`) are excluded from all dumps. These are managed by the PostGIS extension and get recreated automatically -- including them causes conflicts on restore.

### Environment Variables

Both machines need `DATABASE_URL` set before running any commands:

```bash
export DATABASE_URL="postgresql://db-admin:${DB_PASSWORD}@localhost:5432/mydb"
export DATABASE_URL_EXPERIMENTAL="postgresql://db-admin:${DB_PASSWORD}@localhost:5433/mydb"
```

The remote server typically stores these in a dedicated env file (e.g. `/etc/myapp/app.env`).

## Prerequisites

### Local Machine (macOS)

Install PostgreSQL 17 client tools via Homebrew:

```bash
brew install postgresql@17
echo 'export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"' >> ~/.zshrc
zsh -l
pg_dump --version
# pg_dump (PostgreSQL) 17.x
```

### Remote Server (Linux Debian v12)

```bash
sudo apt install postgresql-client
```

The client version should match (or be close to) the server version to avoid compatibility warnings.

## Server to Server

Two containers running on the same remote host -- typically a production database and an experimental/staging replica.

**Production → Experimental** (e.g. seed staging with a fresh prod snapshot):

```bash
cd /home/admin/localtemp/

# 1. Dump production
docker exec postgres-prod pg_dump -U db-admin -d mydb \
  -Fc \
  --exclude-table=spatial_ref_sys \
  --exclude-table=geography_columns \
  --exclude-table=geometry_columns \
  > mydb-prod-dump.sql

# 2. Restore into experimental
docker exec -i postgres-experimental pg_restore \
  -U db-admin -d mydb \
  --clean --if-exists \
  < mydb-prod-dump.sql
```

**Experimental → Production** (e.g. promote a tested experimental state):

```bash
cd /home/admin/localtemp/

# 1. Dump experimental
docker exec postgres-experimental pg_dump -U db-admin -d mydb \
  -Fc \
  --exclude-table=spatial_ref_sys \
  --exclude-table=geography_columns \
  --exclude-table=geometry_columns \
  > mydb-experimental-dump.sql

# 2. Restore into production
docker exec -i postgres-prod pg_restore \
  -U db-admin -d mydb \
  --clean --if-exists \
  < mydb-experimental-dump.sql
```

> **Warning:** Restoring experimental → production overwrites live data. Double-check which direction you're going before running.

## Server to Local

Use this to pull a remote database snapshot to your local machine -- for example, to debug an issue against real data, or to refresh a stale local environment.

**1. Create the dump on the remote server:**

```bash
cd /home/admin/localtemp/

docker exec postgres-prod pg_dump -U db-admin -d mydb \
  -Fc \
  --exclude-table=spatial_ref_sys \
  --exclude-table=geography_columns \
  --exclude-table=geometry_columns \
  > mydb-dump.sql
```

**2. Copy the dump to your local machine:**

```bash
# Run on local machine
cd path/to/local/dump/directory
scp remote-server:/home/admin/localtemp/mydb-dump.sql ./
```

**3. Restore locally:**

```bash
# Into production/dev local container
pg_restore -d ${DATABASE_URL} --clean --if-exists mydb-dump.sql

# Into experimental local container
pg_restore -d ${DATABASE_URL_EXPERIMENTAL} --clean --if-exists mydb-dump.sql
```

`--clean` drops existing objects before recreating them. `--if-exists` suppresses errors when an object doesn't exist yet (useful for first-time restores into an empty DB).

**Alternative: drop and recreate the database first** (cleaner, no leftover objects):

```bash
psql ${DATABASE_URL} -c "DROP DATABASE IF EXISTS mydb;"
psql ${DATABASE_URL} -c "CREATE DATABASE mydb;"
pg_restore -d ${DATABASE_URL} mydb-dump.sql
```

**Schema only** (useful for reviewing structure without data):

```bash
# On remote server
docker exec postgres-prod pg_dump -U db-admin -d mydb \
  --schema-only \
  > /home/admin/localtemp/mydb-schema.sql

# Copy to local
scp remote-server:/home/admin/localtemp/mydb-schema.sql ./
```

## Local to Server

Use this to push a local state to the server -- for example, after running data migrations locally that you want to promote.

**1. Dump locally:**

```bash
cd path/to/local/dump/directory

pg_dump ${DATABASE_URL} \
  -Fc \
  --exclude-table=spatial_ref_sys \
  --exclude-table=geography_columns \
  --exclude-table=geometry_columns \
  > mydb-dump.sql

# Or dump experimental:
pg_dump ${DATABASE_URL_EXPERIMENTAL} \
  -Fc \
  --exclude-table=spatial_ref_sys \
  --exclude-table=geography_columns \
  --exclude-table=geometry_columns \
  > mydb-experimental-dump.sql
```

**2. Copy to remote server:**

```bash
scp mydb-dump.sql remote-server:/home/admin/localtemp/
```

**3. Restore on the server:**

```bash
ssh remote-server
cd /home/admin/localtemp/

# Into experimental
docker exec -i postgres-experimental pg_restore \
  -U db-admin -d mydb \
  --clean --if-exists \
  < mydb-experimental-dump.sql

# Into production
docker exec -i postgres-prod pg_restore \
  -U db-admin -d mydb \
  --clean --if-exists \
  < mydb-dump.sql
```

## Local to Local

Sync between two local Docker containers -- typically from a stable dev database into an experimental one to reset it, or vice versa.

**1. Dump:**

```bash
pg_dump ${DATABASE_URL} \
  -Fc \
  --exclude-table=spatial_ref_sys \
  --exclude-table=geography_columns \
  --exclude-table=geometry_columns \
  > mydb-dump.sql

pg_dump ${DATABASE_URL_EXPERIMENTAL} \
  -Fc \
  --exclude-table=spatial_ref_sys \
  --exclude-table=geography_columns \
  --exclude-table=geometry_columns \
  > mydb-experimental-dump.sql
```

**2. Restore:**

```bash
# Into production/dev local
pg_restore -d ${DATABASE_URL} --clean --if-exists mydb-dump.sql

# Into experimental local
pg_restore -d ${DATABASE_URL_EXPERIMENTAL} --clean --if-exists mydb-dump.sql
pg_restore -d ${DATABASE_URL_EXPERIMENTAL} --clean --if-exists mydb-experimental-dump.sql
```

## Partial Imports and Transactional Testing

When you need to run targeted SQL scripts (e.g. data migrations, category imports) rather than a full restore, use this approach.

**1. Copy SQL files into the container:**

```bash
docker cp my-migration.sql postgres-local-experimental:/tmp/

# Multiple files at once:
for f in migration_*.sql; do
  docker cp "$f" postgres-local-experimental:/tmp/
done
```

**2. Test inside a transaction (safe -- rolls back if anything looks wrong):**

```bash
docker exec -i postgres-local-experimental psql -U db-admin -d mydb << 'EOF'
BEGIN;
\i /tmp/my-migration.sql
ROLLBACK;
EOF
```

Review the output. If everything looks correct, commit:

```bash
docker exec -i postgres-local-experimental psql -U db-admin -d mydb << 'EOF'
BEGIN;
\i /tmp/my-migration.sql
COMMIT;
EOF
```

**3. Direct execution (no transaction wrapper):**

```bash
docker exec -i postgres-local-experimental psql -U db-admin -d mydb < my-migration.sql
```

Use this only when you're confident in the script and don't need rollback safety.

## Quick Reference

| Scenario | Dump Source | Restore Target |
|---|---|---|
| Pull prod to local | `docker exec postgres-prod pg_dump ...` | `pg_restore -d ${DATABASE_URL}` |
| Push local to server | `pg_dump ${DATABASE_URL}` | `docker exec -i postgres-prod pg_restore` |
| Reset experimental from prod | `docker exec postgres-prod pg_dump ...` | `docker exec -i postgres-experimental pg_restore` |
| Local dev → local experimental | `pg_dump ${DATABASE_URL}` | `pg_restore -d ${DATABASE_URL_EXPERIMENTAL}` |

### Common `pg_restore` Flags

| Flag | Effect |
|---|---|
| `--clean` | Drop objects before recreating |
| `--if-exists` | Don't error if object doesn't exist yet |
| `-Fc` | Custom format (used during dump, not restore) |
| `--schema-only` | Dump structure only, no data |

### Inspect a Table's Structure

```bash
docker exec postgres-local psql -U db-admin -d mydb -c "\d my_table"
```
