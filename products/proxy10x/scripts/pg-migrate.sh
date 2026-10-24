#!/usr/bin/env bash
# Apply additive PostgreSQL migrations. Never DROPs. Idempotent.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-$ROOT/infra/pgsql/migrations}"

PGHOST="${PGHOST:-${PROXY10X_PG_HOST:-127.0.0.1}}"
PGPORT="${PGPORT:-${PROXY10X_PG_PORT:-5436}}"
PGUSER="${PGUSER:-${PROXY10X_PG_USER:-proxy10x}}"
PGDATABASE="${PGDATABASE:-${PROXY10X_PG_DB:-proxy10x}}"
export PGPASSWORD="${PGPASSWORD:-${PROXY10X_PG_PASSWORD:-}}"
if [[ -z "$PGPASSWORD" ]]; then
  echo "pg-migrate: set PGPASSWORD or PROXY10X_PG_PASSWORD" >&2
  exit 1
fi

echo "pg-migrate: host=$PGHOST port=$PGPORT db=$PGDATABASE user=$PGUSER"
echo "pg-migrate: dir=$MIGRATIONS_DIR"

psql=(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1)

"${psql[@]}" -c "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());"

shopt -s nullglob
for sql in "$MIGRATIONS_DIR"/*.sql; do
  version="$(basename "$sql" .sql)"
  applied="$("${psql[@]}" -tAc "SELECT 1 FROM schema_migrations WHERE version = '$version'")"
  if [[ "$applied" == "1" ]]; then
    echo "skip $version (already applied)"
    continue
  fi
  echo "apply $version"
  "${psql[@]}" -f "$sql"
done

echo "pg-migrate: done"
