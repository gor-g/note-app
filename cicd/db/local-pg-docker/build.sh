#!/bin/bash


# get the abs path of the current file
script_path="$(dirname "$(realpath "$0")")"
echo "path to the dir: $script_path"

cd $script_path



docker build -t note-app-postgres-with-non-admin-user .