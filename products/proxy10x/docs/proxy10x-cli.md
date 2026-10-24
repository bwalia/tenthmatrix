# proxy10x-cli

Go CLI to administer Proxy10x over the Admin REST API and MCP HTTP surface. Prefer API-only (no SSH). Spec: [PROXY10X_CLI_BUILD_PROMPT.md](./PROXY10X_CLI_BUILD_PROMPT.md).

## Build

```bash
make build          # → bin/proxy10x-cli
make test
make docker         # → ghcr.io/bwalia/proxy10x-cli:latest (local tag)
```

CI: [`.github/workflows/build-proxy10x-cli.yml`](../.github/workflows/build-proxy10x-cli.yml) builds multi-arch binaries **and** publishes the container image to GHCR on `main` / `workflow_dispatch`. Rolling binary release tag: `proxy10x-cli-latest`.

## Docker image (CI/CD)

Published image (linux/amd64 + linux/arm64):

```text
ghcr.io/bwalia/proxy10x-cli:latest
ghcr.io/bwalia/proxy10x-cli:main
ghcr.io/bwalia/proxy10x-cli:sha-<short>
```

Contents: `proxy10x-cli` on `PATH`, plus `bash`, `jq`, `curl`, `git`, and example scripts under `/opt/proxy10x-cli/examples/`.

```bash
# one-shot CLI
docker run --rm \
  -e PROXY10X_BASE_URL=https://lon1.pop0.uk \
  -e PROXY10X_TOKEN \
  ghcr.io/bwalia/proxy10x-cli:latest check nginx -o json

# bash automation (override entrypoint)
docker run --rm -it \
  -e PROXY10X_BASE_URL -e PROXY10X_TOKEN -e PROXY10X_ASSUME_YES=1 \
  -v "$PWD:/work" \
  --entrypoint bash \
  ghcr.io/bwalia/proxy10x-cli:latest \
  -lc 'proxy10x-cli pull -d /work/cfg --resources rules && jq . /work/cfg/rules/*/*.json | head'
```

Pipeline examples:

- GitHub Actions: [`examples/proxy10x-cli/ci-github-actions.yml`](../examples/proxy10x-cli/ci-github-actions.yml)
- GitLab CI: [`examples/proxy10x-cli/ci-gitlab-ci.yml`](../examples/proxy10x-cli/ci-gitlab-ci.yml)

Local image build (repo root; uses CLI-scoped ignorefile so the main app `.dockerignore` stays untouched):

```bash
make docker
# or:
docker build -f cmd/proxy10x-cli/Dockerfile --ignorefile cmd/proxy10x-cli/dockerignore \
  -t ghcr.io/bwalia/proxy10x-cli:dev .
```

## Auth

```bash
export PROXY10X_BASE_URL=https://lon1.pop0.uk
proxy10x-cli auth login -u admin@example.com   # prompts for password
# or:
export PROXY10X_TOKEN=eyJ...
export PROXY10X_MCP_API_KEY=...                # for MCP tools
```

Login uses `POST /api/user/login` (`email` + `password`). `-u` / `--username` are aliases for the email field. JWT is stored at `~/.config/proxy10x/token` (mode 0600).

Config file: `~/.config/proxy10x/cli.yaml` (see `examples/proxy10x-cli/cli.yaml.example`). Precedence: flags > `PROXY10X_*` env > config file.

## Happy path: pull → edit → push → check

```bash
proxy10x-cli pull -d ./cfg --resources servers,rules,waf_rules,waf_policies
$EDITOR ./cfg/rules/prod/*.json
proxy10x-cli push -d ./cfg --dry-run --diff
proxy10x-cli push -d ./cfg --yes --verify
proxy10x-cli check nginx
```

Staging layout:

```text
cfg/
  meta.yaml
  servers/<profile>/*.json
  rules/<profile>/*.json
  waf_rules/<profile>/*.json
  waf_policies/<profile>/*.json
```

## Commands (v1)

| Area | Commands |
|------|----------|
| Auth | `auth login\|logout\|whoami\|token` |
| CRUD | `server\|rule\|waf rules\|waf policies` `list\|get\|create\|update\|delete\|export\|apply` |
| Sync | `pull`, `push`, `apply -f` |
| Status | `status health\|ready\|openresty` |
| Checks | `check health\|openresty\|config\|nginx\|all` |
| MCP | `mcp manifest\|tools\|resources\|resource\|call\|capabilities\|schemas` |

Exit codes: `0` ok, `1` usage, `2` auth, `3` API, `4` validation, `5` partial multi-target.

## Examples

- [`examples/proxy10x-cli/roundtrip-rule.sh`](../examples/proxy10x-cli/roundtrip-rule.sh)
- [`examples/proxy10x-cli/push-server-bundle.sh`](../examples/proxy10x-cli/push-server-bundle.sh)

## Notes

- List/get query shape matches Admin UI (`params` JSON + `profile_id`).
- Prod-like base URLs require `--yes` on `push` (or `PROXY10X_ASSUME_YES=1` in CI).
- MCP write tools need `--write` or `--yes`.
- `check config` / `check nginx` call MCP `validate_config` when available.
