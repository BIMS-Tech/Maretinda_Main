#!/usr/bin/env bash
# Restore the database from a file on this server. Stops the app first.
#
#   scripts/restore-db.sh /var/backups/maretinda/medusa-20261101T190000Z.dump   (nightly backup)
#   scripts/restore-db.sh ~/medusa.sql.gz                                     (Cloud SQL export, first migration)
#
# To restore from R2, download the dump first (Cloudflare dashboard, or
# `rclone copy` with the same settings as backup-db.sh).
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
. ./.env
set +a

FILE=${1:?usage: restore-db.sh <file.dump|file.sql|file.sql.gz>}
[ -f "$FILE" ] || { echo "no such file: $FILE" >&2; exit 2; }

read -r -p "This REPLACES the data in database '$POSTGRES_DB'. Type the database name to continue: " CONFIRM
[ "$CONFIRM" = "$POSTGRES_DB" ] || { echo "aborted"; exit 1; }

docker compose stop backend store
# worker only exists when the "split" profile is enabled
docker compose stop worker 2> /dev/null || true
# --wait: on a fresh volume Postgres runs initdb before it accepts connections
docker compose up -d --wait postgres

psql() {
  docker compose exec -T postgres psql -U "$POSTGRES_USER" "$@"
}

# Start from an empty database so a restore never mixes old and new rows
psql -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\" WITH (FORCE);"
psql -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$POSTGRES_DB\" OWNER \"$POSTGRES_USER\";"

case "$FILE" in
  *.dump)
    docker compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl < "$FILE"
    ;;
  *.sql | *.sql.gz)
    # Cloud SQL exports grant privileges to its own roles; create them so
    # those statements succeed instead of filling the log with errors.
    psql -d postgres -c "DO \$\$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cloudsqlsuperuser') THEN CREATE ROLE cloudsqlsuperuser NOLOGIN; END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cloudsqladmin') THEN CREATE ROLE cloudsqladmin NOLOGIN; END IF;
    END \$\$;"
    LOG="/tmp/restore-$(date +%s).log"
    if [[ "$FILE" == *.gz ]]; then
      gunzip -c "$FILE" | psql -d "$POSTGRES_DB" > "$LOG" 2>&1 || true
    else
      psql -d "$POSTGRES_DB" < "$FILE" > "$LOG" 2>&1 || true
    fi
    echo "restore finished; errors (if any) from $LOG:"
    grep -E '^(ERROR|psql:.*ERROR)' "$LOG" | sort | uniq -c | head -30 || echo "  none"
    ;;
  *)
    echo "unrecognised file type: $FILE" >&2
    exit 2
    ;;
esac

psql -d "$POSTGRES_DB" -c "SELECT count(*) AS tables FROM information_schema.tables WHERE table_schema = 'public';"
echo "Database restored. Start the app with: docker compose up -d"
