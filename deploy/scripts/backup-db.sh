#!/usr/bin/env bash
# Nightly Postgres dump, uploaded to Cloudflare R2. Installed in the deploy
# user's crontab by bootstrap-server.sh (19:00 UTC = 03:00 Manila).
#
# R2 bills only past 10 GB-month of storage and 1M writes / 10M reads a month,
# and never for downloads. One dump a night with 14-day retention stays well
# under that while the database is small; check the bucket size in the
# Cloudflare dashboard as the store grows.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
. ./.env
set +a

: "${R2_ACCOUNT_ID:?set R2_ACCOUNT_ID in .env}"
: "${R2_ACCESS_KEY_ID:?set R2_ACCESS_KEY_ID in .env}"
: "${R2_SECRET_ACCESS_KEY:?set R2_SECRET_ACCESS_KEY in .env}"
: "${R2_BUCKET:?set R2_BUCKET in .env}"

DIR=/var/backups/maretinda
NAME="medusa-$(date -u +%Y%m%dT%H%M%SZ).dump"
mkdir -p "$DIR"

docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$DIR/$NAME"
# Reading the archive's table of contents catches a truncated dump before it
# replaces a good one in the bucket.
docker compose exec -T postgres pg_restore --list < "$DIR/$NAME" > /dev/null

rclone() {
  docker run --rm -v "$DIR:/data" \
    -e RCLONE_CONFIG_R2_TYPE=s3 \
    -e RCLONE_CONFIG_R2_PROVIDER=Cloudflare \
    -e RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
    -e RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    -e RCLONE_CONFIG_R2_ENDPOINT="https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com" \
    -e RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true \
    rclone/rclone:1.68.2 "$@"
}

rclone copy "/data/$NAME" "r2:$R2_BUCKET/postgres/"
rclone delete "r2:$R2_BUCKET/postgres/" --min-age "${BACKUP_RETENTION_DAYS:-14}d"

# Two local copies are enough for a quick restore without downloading
find "$DIR" -name 'medusa-*.dump' -mtime +1 -delete

echo "$(date -u) backed up $NAME ($(du -h "$DIR/$NAME" | cut -f1))"
if [ -n "${BACKUP_PING_URL:-}" ]; then
  curl -fsS -m 10 --retry 3 "$BACKUP_PING_URL" > /dev/null
fi
