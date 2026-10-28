#!/usr/bin/env bash
# TEST SERVER ONLY. Replace the test database with a production backup, then
# scrub it (scrub-test-data.sql) before the backend ever sees it.
#
#   scripts/refresh-test-data.sh ~/medusa-20261028T190000Z.dump
#
# Get a dump onto this server first, e.g. from your laptop:
#   ssh deploy@<prod-ip> 'ls -t /var/backups/maretinda/medusa-*.dump | head -1 | xargs cat' \
#     | ssh deploy@<test-ip> 'cat > ~/prod.dump'
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
. ./.env
set +a

FILE=${1:?usage: refresh-test-data.sh <file.dump|file.sql.gz>}

# The one thing this script must never do is scrub production
case "$API_DOMAIN" in
  test-*) ;;
  *) echo "refusing: API_DOMAIN is '$API_DOMAIN', not a test-* domain" >&2; exit 1 ;;
esac

scripts/restore-db.sh "$FILE"

echo "scrubbing personal data, courier and payment credentials..."
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -v ON_ERROR_STOP=1 --single-transaction < scripts/scrub-test-data.sql

if docker image inspect maretinda/backend:live > /dev/null 2>&1; then
  # Brings the schema up to the test branch's code before serving it
  docker compose run --rm --no-deps backend node_modules/.bin/medusa db:migrate
  docker compose run --rm --no-deps backend node .medusa/server/src/scripts/run-custom-migrations.js
  docker compose up -d backend
  echo "Test data ready. Rebuild search: test admin → Settings → Algolia → Sync."
else
  echo "Test data ready. No backend image yet: run the test deploy workflow."
fi
