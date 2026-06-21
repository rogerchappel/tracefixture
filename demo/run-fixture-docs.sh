#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cd "$repo_root"

npm run build >/dev/null

node dist/cli.js record \
  --out "$tmp/hello.json" \
  --cwd "$repo_root" \
  --cwd-label "<REPO>" \
  --notes "Fixture docs demo using the checked-in hello command." \
  -- node fixtures/examples/hello-command.mjs

node dist/cli.js replay "$tmp/hello.json" --cwd "$repo_root"
node dist/cli.js render "$tmp/hello.json" --markdown "$tmp/hello.md"

grep -q "hello from tracefixture" "$tmp/hello.md"
grep -q "<REPO>" "$tmp/hello.json"

echo "Demo fixture: $tmp/hello.json"
echo "Demo Markdown: $tmp/hello.md"
