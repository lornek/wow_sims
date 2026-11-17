#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node build.cjs
baseline_dir=$(mktemp -d /tmp/healbot-v58.XXXXXX)
trap 'rm -rf "$baseline_dir"' EXIT
git archive 388a4db677b2b01e07d0e35991c18907cafb24bf | tar -x -C "$baseline_dir"
node "$baseline_dir/build.cjs"
# Build a separately namespaced exact v58 reference; source checkout is untouched.
mkdir -p dist/baseline
cp -a "$baseline_dir/dist/." dist/baseline/
printf '%s\n' 'Built release dashboard at /release/ and exact v58 at /baseline/healbot/druid/.'
