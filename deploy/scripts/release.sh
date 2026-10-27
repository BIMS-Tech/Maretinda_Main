#!/usr/bin/env bash
# Switch backend or store to an image that is already loaded on this server.
#
#   scripts/release.sh backend <git-sha>
#   scripts/release.sh store <git-sha>
#
# CI calls this after `docker load`. Rolling back is the same command with an
# older sha — list what is available with `docker images maretinda/backend`.
set -euo pipefail
cd "$(dirname "$0")/.."

SERVICE=${1:?usage: release.sh backend|store <tag>}
TAG=${2:?usage: release.sh backend|store <tag>}
case "$SERVICE" in
  backend) PORT=9000; HEALTH_PATH=/health ;;
  store) PORT=3000; HEALTH_PATH=/ ;;
  *) echo "unknown service: $SERVICE" >&2; exit 2 ;;
esac

IMAGE="maretinda/$SERVICE"
docker image inspect "$IMAGE:$TAG" > /dev/null
PREVIOUS=$(docker image inspect -f '{{.Id}}' "$IMAGE:live" 2> /dev/null || true)

rollback_tag() {
  if [ -n "$PREVIOUS" ]; then
    docker tag "$PREVIOUS" "$IMAGE:live"
  fi
}

docker tag "$IMAGE:$TAG" "$IMAGE:live"

# No-op once they are running; needed on the very first release
docker compose up -d --wait postgres redis

SERVICES=("$SERVICE")
if [ "$SERVICE" = backend ]; then
  # Same as the maretinda-migrate Cloud Run job. Runs before the swap, so a
  # failed migration leaves the running version untouched.
  if ! docker compose run --rm --no-deps backend node_modules/.bin/medusa db:migrate; then
    echo "migration failed — keeping the previous version" >&2
    rollback_tag
    exit 1
  fi
  # db:migrate skips src/migrations; this applies each of those once
  if ! docker compose run --rm --no-deps backend node .medusa/server/src/scripts/run-custom-migrations.js; then
    echo "custom migration failed — keeping the previous version" >&2
    rollback_tag
    exit 1
  fi
  # `config --services` lists only services in active profiles
  if docker compose config --services | grep -qx worker; then
    SERVICES+=(worker)
  fi
fi

docker compose up -d --no-deps "${SERVICES[@]}"

echo "waiting for $SERVICE to report healthy..."
for _ in $(seq 1 40); do
  if docker compose exec -T "$SERVICE" curl -fsS -o /dev/null "http://localhost:$PORT$HEALTH_PATH"; then
    echo "$SERVICE is live on $TAG"
    # Keep the five most recent tags for rollbacks, drop the rest
    docker images "$IMAGE" --format '{{.Tag}}' | grep -vx live | tail -n +6 \
      | xargs -r -I{} docker rmi "$IMAGE:{}" > /dev/null || true
    exit 0
  fi
  sleep 5
done

echo "$SERVICE did not become healthy — rolling back" >&2
rollback_tag
docker compose up -d --no-deps "${SERVICES[@]}"
exit 1
