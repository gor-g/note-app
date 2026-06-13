#!/bin/bash

# Tears down the local Postgres setup.
#
# By default this only stops and removes the container, leaving the data volume
# intact so the next `run.sh` keeps your existing data.
#
# With -d ("destroy"), it also deletes the data volume, the docker network and
# the built image — a full clean slate. THIS DELETES ALL DATABASE DATA.
#
# Usage:
#   ./teardown.sh        # stop + remove the container only
#   ./teardown.sh -d     # also delete data volume, network and image

set -e

container="postgres_17_note_app"
volume="pg_data_note_app"
network="network_note_app"
image="note-app-postgres-with-non-admin-user"

destroy=false
while getopts "d" opt; do
  case "$opt" in
    d) destroy=true ;;
    *)
      echo "Usage: $0 [-d]" >&2
      exit 1
      ;;
  esac
done

# Stop + remove the container. `docker rm -f` is idempotent-ish but errors if the
# container doesn't exist, so guard with a existence check (|| true keeps set -e
# happy when there's nothing to remove).
echo "Stopping and removing container '$container'..."
docker rm -f "$container" 2>/dev/null || echo "  (no such container)"

if ! $destroy; then
  echo "Done. Data volume '$volume' kept (use -d to delete it)."
  exit 0
fi

echo "Deleting data volume '$volume'..."
docker volume rm "$volume" 2>/dev/null || echo "  (no such volume)"

echo "Removing network '$network'..."
docker network rm "$network" 2>/dev/null || echo "  (no such network, or still in use)"

echo "Removing image '$image'..."
docker rmi "$image" 2>/dev/null || echo "  (no such image)"

echo "Done. Full teardown complete."
