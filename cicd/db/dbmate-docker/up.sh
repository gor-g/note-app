#!/bin/bash

set -e

script_path="$(dirname "$(realpath "$0")")"
echo "path to the dir: $script_path"

project_root="$(realpath "$script_path/../../..")"

source "$project_root/cicd/db/db.env"
source "$project_root/secrets/db_admin_pwd.env"

migrations_path="$project_root/back/db/migrations"

docker run --rm -it \
  --network network_note_app \
  -v "$migrations_path:/db/migrations" \
  -e DATABASE_URL="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres_17_note_app:5432/$POSTGRES_DB?sslmode=disable" \
  ghcr.io/amacneil/dbmate \
  -d /db/migrations \
  up