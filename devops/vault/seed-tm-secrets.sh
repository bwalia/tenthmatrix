#!/usr/bin/env bash
# Requires bash >= 4 (associative arrays): `brew install bash` on macOS.
#
# Seed TenthMatrix per-environment runtime secrets into Vault
# (vault.workstation.co.uk, KV v2 compat mount `kv`), mirroring Workstation's
# devops/vault/seed-wsw-secrets.sh. Each env gets its own path at the ROOT of
# the kv mount, prefixed by the namespace slug:
#
#   tenthmatrix/int/config   tenthmatrix/test/config
#   tenthmatrix/acc/config   tenthmatrix/prod/config
#
# The External Secrets Operator syncs each path into Secret tm-secret-<env>
# (devops/helm-charts/tm-chart/templates/externalsecret.yaml).
#
# DRY-RUN BY DEFAULT. Nothing is written unless you pass --apply.
# Values are read from a LOCAL env file you keep outside git (never commit it;
# devops/vault/*.env is gitignored):
#
#   devops/vault/tm-<env>.env     (default; override with --env-file)
#
# Keys (see devops/VAULT-SECRETS.md):
#   required  CAPTCHA_SITE_KEY API_SECRET JWT_SECRET_KEY BUSINESS_CODE
#             OPSAPI_URL WEBSITE_NAMESPACE OPSAPI_API_KEY
#   optional  REVALIDATE_SECRET (generated if absent; register it as the env's
#             OpsAPI CMS webhook secret), REDIS_URL
#
# Usage:
#   ./devops/vault/seed-tm-secrets.sh int                         # dry run
#   ./devops/vault/seed-tm-secrets.sh int --env-file ~/tm-int.env # dry run, other file
#   WSLVAULT_TOKEN='<jwt>' ./devops/vault/seed-tm-secrets.sh int --apply
#   WSLVAULT_TOKEN='<jwt>' ./devops/vault/seed-tm-secrets.sh int --apply --force   # overwrite
set -euo pipefail

VAULT_ADDR="${VAULT_ADDR:-https://vault.workstation.co.uk}"
KV_MOUNT="${KV_MOUNT:-kv}"
PATH_PREFIX="${PATH_PREFIX:-tenthmatrix}"

REQUIRED=(CAPTCHA_SITE_KEY API_SECRET JWT_SECRET_KEY BUSINESS_CODE OPSAPI_URL WEBSITE_NAMESPACE OPSAPI_API_KEY)
OPTIONAL=(REVALIDATE_SECRET REDIS_URL)

usage() { sed -n '2,/^set -euo/p' "$0" | sed 's/^# \{0,1\}//; /^set -euo/d'; exit "${1:-0}"; }

ENV_NAME="" ENV_FILE="" APPLY=0 FORCE=0
while [ $# -gt 0 ]; do
  case "$1" in
    int|test|acc|prod) ENV_NAME="$1" ;;
    --env-file) ENV_FILE="${2:?--env-file needs a path}"; shift ;;
    --env-file=*) ENV_FILE="${1#*=}" ;;
    --apply) APPLY=1 ;;
    --force) FORCE=1 ;;
    -h|--help) usage 0 ;;
    *) echo "unknown argument: $1" >&2; usage 1 ;;
  esac
  shift
done
[ -n "$ENV_NAME" ] || { echo "error: give one env: int | test | acc | prod" >&2; usage 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/tm-${ENV_NAME}.env}"
[ -f "$ENV_FILE" ] || { echo "error: env file not found: $ENV_FILE (copy the keys from .env.example)" >&2; exit 1; }
command -v jq >/dev/null || { echo "error: jq required" >&2; exit 1; }

# Parse KEY=VALUE lines without executing the file (no `source`): comments and
# blank lines skipped, surrounding single/double quotes stripped.
declare -A VALS=()
while IFS= read -r line || [ -n "$line" ]; do
  line="${line%$'\r'}"
  [[ -z "${line// }" || "$line" =~ ^[[:space:]]*# ]] && continue
  [[ "$line" =~ ^[[:space:]]*(export[[:space:]]+)?([A-Z_][A-Z0-9_]*)=(.*)$ ]] || continue
  k="${BASH_REMATCH[2]}" v="${BASH_REMATCH[3]}"
  if [[ "$v" =~ ^\"(.*)\"$ || "$v" =~ ^\'(.*)\'$ ]]; then v="${BASH_REMATCH[1]}"; fi
  VALS["$k"]="$v"
done < "$ENV_FILE"

missing=()
for k in "${REQUIRED[@]}"; do [ -n "${VALS[$k]:-}" ] || missing+=("$k"); done
if [ ${#missing[@]} -gt 0 ]; then
  echo "error: $ENV_FILE is missing required key(s): ${missing[*]}" >&2
  exit 1
fi
if [ "${VALS[WEBSITE_NAMESPACE]}" != "tenthmatrix" ]; then
  echo "error: WEBSITE_NAMESPACE must be 'tenthmatrix' (got '${VALS[WEBSITE_NAMESPACE]}')" >&2
  exit 1
fi
case "${VALS[OPSAPI_URL]}" in
  */) ;;
  *) echo "error: OPSAPI_URL must end with '/' (e.g. http://workstation-opsapi/)" >&2; exit 1 ;;
esac

GENERATED_REVALIDATE=0
if [ -z "${VALS[REVALIDATE_SECRET]:-}" ]; then
  command -v openssl >/dev/null || { echo "error: openssl required to generate REVALIDATE_SECRET" >&2; exit 1; }
  VALS[REVALIDATE_SECRET]="$(openssl rand -hex 32)"
  GENERATED_REVALIDATE=1
fi

# Build the JSON object from the allow-listed keys only.
CONFIG='{}'
for k in "${REQUIRED[@]}" "${OPTIONAL[@]}"; do
  [ -n "${VALS[$k]:-}" ] || continue
  CONFIG="$(jq --arg k "$k" --arg v "${VALS[$k]}" '. + {($k): $v}' <<<"$CONFIG")"
done

TARGET="${VAULT_ADDR%/}/v1/${KV_MOUNT}/data/${PATH_PREFIX}/${ENV_NAME}/config"
echo "=== ${PATH_PREFIX}/${ENV_NAME}/config  (${TARGET}) ==="
echo "  source: $ENV_FILE"
echo "  keys:   $(jq -r 'keys | join(", ")' <<<"$CONFIG")"
for k in $(jq -r 'keys[]' <<<"$CONFIG"); do
  v="$(jq -r --arg k "$k" '.[$k]' <<<"$CONFIG")"
  case "$k" in
    WEBSITE_NAMESPACE|OPSAPI_URL) printf '    %-18s %s\n' "$k" "$v" ;;
    *) printf '    %-18s %s\n' "$k" "<set, ${#v} chars>" ;;
  esac
done
[ "$GENERATED_REVALIDATE" = 1 ] && echo "  REVALIDATE_SECRET was generated (not in the env file)."

if [ "$APPLY" != 1 ]; then
  echo "  [dry-run] nothing written. Re-run with --apply (and WSLVAULT_TOKEN) to write."
  exit 0
fi

: "${WSLVAULT_TOKEN:?set WSLVAULT_TOKEN to a wslvault JWT that can write ${PATH_PREFIX}/*}"

if [ "$FORCE" != 1 ]; then
  existing="$(curl -sS --max-time 20 -H "X-Vault-Token: ${WSLVAULT_TOKEN}" "$TARGET" | jq -r '.data.data // empty' 2>/dev/null || true)"
  if [ -n "$existing" ]; then
    echo "  already exists — not overwriting (pass --force to replace)"; exit 0
  fi
fi

code="$(jq -n --argjson data "$CONFIG" '{data: $data}' | curl -sS --max-time 20 -o /dev/null -w '%{http_code}' \
  -X POST -H "X-Vault-Token: ${WSLVAULT_TOKEN}" -H 'Content-Type: application/json' --data-binary @- "$TARGET")"
if [ "$code" = "200" ] || [ "$code" = "204" ]; then
  echo "  written (HTTP $code)"
  if [ "$GENERATED_REVALIDATE" = 1 ]; then
    echo "  -> register this as the ${ENV_NAME} OpsAPI CMS webhook secret (namespace tenthmatrix):"
    echo "     REVALIDATE_SECRET=${VALS[REVALIDATE_SECRET]}"
  fi
else
  echo "  write failed (HTTP $code)" >&2; exit 1
fi
