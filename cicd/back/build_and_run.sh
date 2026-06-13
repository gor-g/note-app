#!/bin/bash

set -e

script_path="$(dirname "$(realpath "$0")")"
echo "path to the dir: $script_path"

project_root="$(realpath "$script_path/../..")"


source "$project_root/cicd/db/db.env"
source "$project_root/secrets/db_admin_pwd.env"

cd "$project_root/back"

source "$project_root/cicd/db/db.env"
source "$project_root/secrets/db_non_admin_pwd.env"

export DATABASE_URL="postgres://$POSTGRES_NON_ADMIN_USER_LOGIN:$POSTGRES_NON_ADMIN_USER_PASSWORD@localhost:5432/$POSTGRES_DB?sslmode=disable"

# Origin of the Vite dev server; the API uses it for CORS.
export FRONTEND_ORIGIN="http://localhost:5173"

go build -o "$project_root/cicd/back/bin/api" ./cmd/api
"$project_root/cicd/back/bin/api"