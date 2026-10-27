#!/usr/bin/env bash
# One-time copy of the old GCS uploads (downloaded to a folder) into the R2
# media bucket, keeping every object's path so stored keys keep resolving.
#
#   scripts/upload-media.sh ~/maretinda-prod-uploads
#
# Uses the same R2 token as backups (R2_* in .env); the token must have
# Object Read & Write on R2_MEDIA_BUCKET as well.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
. ./.env
set +a

SRC=$(cd "${1:?usage: upload-media.sh <folder>}" && pwd)
BUCKET=${R2_MEDIA_BUCKET:-maretinda-media}

docker run --rm -v "$SRC:/data:ro" \
  -e RCLONE_CONFIG_R2_TYPE=s3 \
  -e RCLONE_CONFIG_R2_PROVIDER=Cloudflare \
  -e RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
  -e RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  -e RCLONE_CONFIG_R2_ENDPOINT="https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com" \
  -e RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true \
  rclone/rclone:1.68.2 copy /data "r2:$BUCKET" --checksum --stats-one-line -v

echo "Uploaded $(find "$SRC" -type f | wc -l | tr -d ' ') files to $BUCKET"
