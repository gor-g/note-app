#!/bin/bash


# get the abs path of the current file
script_path="$(dirname "$(realpath "$0")")"
echo "path to the dir: $script_path"

cd $script_path


docker run -d \
  --name postgres_17_note_app \
  --network network_note_app \
  -v pg_data_note_app:/var/lib/postgresql/data \
  --env-file ../db.env \
  --env-file ../../../secrets/db_admin_pwd.env \
  --env-file ../../../secrets/db_non_admin_pwd.env \
  -p 5432:5432 \
  note-app-postgres-with-non-admin-user
