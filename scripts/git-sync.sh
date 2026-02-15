#!/usr/bin/env bash
set -e

if [[ -z "$(git status --porcelain)" ]]; then
  echo "Working tree clean. Nothing to sync."
  exit 0
fi

timestamp="$(date +"%Y-%m-%d %H:%M:%S")"
git add -A
git commit -m "Update ${timestamp}"
git push
