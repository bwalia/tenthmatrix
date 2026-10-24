#!/usr/bin/env bash
# Push a local bundle (servers + rules + waf policies) to a target.
set -euo pipefail

BASE="${PROXY10X_BASE_URL:?set PROXY10X_BASE_URL}"
DIR="${1:?usage: $0 ./bundles/my-app}"
CLI="${PROXY10X_CLI:-proxy10x-cli}"

"${CLI}" check config --base-url "$BASE" || true
"${CLI}" push -d "$DIR" \
  --resources servers,rules,waf_policies \
  --base-url "$BASE" --yes --verify -o json
"${CLI}" check nginx --base-url "$BASE"
