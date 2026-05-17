#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

rm -rf fixtures/tmp
mkdir -p fixtures/tmp

node dist/cli.js record \
  --out fixtures/tmp/demo.json \
  --cwd "$repo_root" \
  --cwd-label '<REPO>' \
  --capture fixtures/tmp/demo-output.txt \
  -- node scripts/demo-command.mjs

node dist/cli.js replay fixtures/tmp/demo.json --cwd "$repo_root"
node dist/cli.js render fixtures/tmp/demo.json --markdown fixtures/tmp/demo.md
test -s fixtures/tmp/demo.md
