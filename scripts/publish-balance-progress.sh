#!/usr/bin/env bash
set -euo pipefail

# Shared checkpoint publisher; touching this file intentionally restarts balance workflows.
branch="${GITHUB_REF_NAME:-feature/balance-dashboard}"
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git pull --rebase origin "$branch"
node scripts/balance-progress.mjs

if ! git diff --quiet -- dist/balance-progress.json; then
  git add dist/balance-progress.json
  git commit -m "chore: update balance progress"
  git push origin HEAD:"$branch"
fi
