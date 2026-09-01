#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
checkout=$(mktemp -d "${TMPDIR:-/tmp}/tracefixture-package-smoke.XXXXXX")
trap 'rm -rf "$checkout"' EXIT

git -C "$repo_root" archive HEAD | tar -x -C "$checkout"
cd "$checkout"
npm ci --ignore-scripts --no-audit --no-fund
npm run build
node scripts/verify-package.mjs
