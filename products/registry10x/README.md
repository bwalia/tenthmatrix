# Registry10x

**The container registry for AI-assisted development.** Registry10x is a cloud-native Docker/OCI container registry built in Rust, with multi-tenancy, zero-trust authentication and pull-through caching.

AI coding agents and the pipelines around them build and pull far more images than people do. Registry10x keeps that traffic fast and accountable: pull-through caching for Docker Hub, GHCR, GCR, Quay and registry.k8s.io, OIDC tokens for CI (GitHub Actions, GitLab CI) instead of long-lived passwords, cosign signing with verify-on-pull, a hash-chained audit log, and CVE scanning with AI-assisted analysis.

**With the rest of the 10x family.** Run it behind [Proxy10x](../proxy10x/) at the edge, reach private registries over [VPN10x](../vpn10x/), and keep signing keys in [Vault10x](../vault10x/).

Part of the [TenthMatrix](https://www.tenthmatrix.com) product family; lives in the TenthMatrix monorepo at `products/registry10x/`. Site: [registry10x.com](https://registry10x.com) (built from `docs/landing/`).

> **Wire compatibility.** Signature artifact media types (`application/vnd.spectoncr.signing.*`) keep their original spelling on purpose: signatures already stored in a registry carry them.

> **CI is not wired yet.** The workflows under [`.github/workflows/`](.github/workflows/) were carried over but are inactive: GitHub only runs workflows from the repository root. The site is published by the root `products-pages.yml`.

## Features

- **OCI Distribution API v2** compliant registry
- **Pull-through cache** for Docker Hub, GHCR, GCR, Quay.io, and registry.k8s.io
- **Multi-tenancy** with Tenant, Project, AccessPolicy, TokenPolicy, and ImageVerificationPolicy CRDs
- **Zero-trust auth** via OIDC (Google, GitHub Actions, GitLab CI, Azure AD)
- **Image signing** -- cosign simple-signing (sigstore-rs), Vault/file keys, `.sig` artifacts, verify-on-pull (kill-switch OFF by default)
- **Chained registry audit** -- HMAC-SHA256 hash chain, `/v2/_audit` query/verify/export, fail-closed writes when Postgres audit is down
- **Multiple storage backends** -- filesystem, S3, GCS, Azure Blob
- **Multipart large-layer uploads** -- multi-GB blobs without single-request timeouts
- **High availability** -- stateless services, HPA, PDB, circuit breakers
- **Multi-region replication** with async/semi-sync modes
- **Observability** -- Prometheus metrics, structured JSON logging, OpenTelemetry tracing
- **Rate limiting** per IP and per tenant
- **Multi-architecture** -- linux/amd64 and linux/arm64
- **Webhook notifications** for registry events
- **Image vulnerability scanning** -- SBOM extraction, OSV + GHSA + NVD feeds, AI-assisted CVE analysis, policy gate, Slack PDF reports

## Architecture

```
                        +------------------+
                        |    Ingress /     |
                        |   LoadBalancer   |
                        +--------+---------+
                                 |
                    /v2          |         /auth
               +----+----+      |     +----+----+
               | Registry |      |     |  Auth   |
               | (:5000)  |------+-----| (:5001) |
               +----+----+            +----+----+
                    |                      |
            +-------+-------+              |
            |       |       |         OIDC Provider
         S3/GCS  Azure  Filesystem   (Google, GitHub, etc.)
```

| Service | Port | Metrics | Purpose |
|---------|------|---------|---------|
| `registry10x-registry` | 5000 | 9090 | OCI Distribution API, blob/manifest storage, pull-through cache |
| `registry10x-auth` | 5001 | 9091 | OIDC validation, JWT issuance, RBAC policy resolution |

## Quick Start (Local)

Run Registry10x locally in under 5 minutes.

### Option A: Docker Run (Simplest)

```bash
docker run -d --name registry10x -p 5000:5000 bwalia/registry10x:latest
```

### Option B: Docker Compose (Full Stack)

```bash
git clone https://github.com/bwalia/tenthmatrix.git
cd registry10x
docker compose up -d
```

This starts the registry on `localhost:5000`, auth on `localhost:5001`, and auto-generates JWT signing keys.

### Test It

```bash
# Login (default dev credentials)
docker login localhost:5000 -u admin -p admin

# Tag and push an image (2-segment path -- standard Docker)
docker tag nginx:latest localhost:5000/myorg/nginx:latest
docker push localhost:5000/myorg/nginx:latest

# Pull it back
docker pull localhost:5000/myorg/nginx:latest
```

## Quick Start (Kubernetes)

### Helm Install

```bash
# OCI registry (recommended)
helm install registry10x oci://ghcr.io/bwalia/charts/registry10x \
  --namespace registry10x --create-namespace

# Or via Helm repository
helm repo add registry10x https://bwalia.github.io/registry10x
helm repo update
helm install registry10x registry10x/registry10x \
  --namespace registry10x --create-namespace
```

### Verify

```bash
kubectl port-forward -n registry10x svc/registry10x-registry 5000:5000 &
curl http://localhost:5000/health
# {"status":"healthy"}
```

See [examples/kubernetes/](examples/kubernetes/) for minimal and HA production manifests.

## Authentication

### Docker CLI Login

```bash
# Development (bootstrap admin)
docker login registry.example.com -u admin -p admin

# Request a short-lived token via API
TOKEN=$(curl -s -u admin:admin \
  "https://registry.example.com/auth/token?service=registry10x-registry&scope=repository:myorg/myapp:push,pull" \
  | jq -r '.token')

# Use the token
docker login registry.example.com -u token -p "$TOKEN"
```

### OIDC (Production)

```bash
helm install registry10x oci://ghcr.io/bwalia/charts/registry10x \
  --set oidc.enabled=true \
  --set oidc.issuerUrl="https://accounts.google.com" \
  --set oidc.clientId="YOUR_CLIENT_ID" \
  --set oidc.clientSecret="YOUR_CLIENT_SECRET"
```

See [docs/authentication.md](docs/authentication.md) for full details including CI/CD integration.

## Multi-Tenant Example

Registry10x supports both standard Docker 2-segment paths and multi-tenant 3-segment paths:

```bash
# Standard Docker (2-segment -- uses default tenant automatically)
docker tag nginx registry.example.com/myorg/nginx:latest
docker push registry.example.com/myorg/nginx:latest

# Multi-tenant (3-segment -- explicit tenant)
docker tag nginx registry.example.com/tenant-a/project-1/nginx:latest
docker push registry.example.com/tenant-a/project-1/nginx:latest
```

Manage tenants via Kubernetes CRDs:

```yaml
apiVersion: registry10x.com/v1alpha1
kind: Tenant
metadata:
  name: my-org
spec:
  displayName: My Organization
  adminEmail: admin@my-org.com
  quotas:
    storageBytes: 107374182400  # 100 GiB
    maxRepositories: 500
    pullRateLimit: 1000
    pushRateLimit: 500
```

See [docs/multi-tenancy.md](docs/multi-tenancy.md) for full details.

## Pull-Through Cache

Deploy Registry10x as a caching proxy with zero configuration:

```bash
helm install registry10x oci://ghcr.io/bwalia/charts/registry10x \
  --namespace registry10x --create-namespace
```

Pull images through the cache:

```bash
docker pull <registry10x-host>:5000/library/nginx:latest       # Docker Hub
docker pull <registry10x-host>:5000/ghcr.io/org/repo:tag       # GHCR
docker pull <registry10x-host>:5000/quay.io/prometheus/prometheus:latest  # Quay
```

### Configure containerd Mirror

Add to `/etc/containerd/config.toml`:

```toml
[plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
  endpoint = ["http://registry10x-registry.registry10x.svc.cluster.local:5000"]
```

## Mirror / HA Example

Registry10x supports multi-region replication with automatic failover:

```bash
helm install registry10x oci://ghcr.io/bwalia/charts/registry10x \
  --set registry.replicas=3 \
  --set auth.replicas=2 \
  --set multiRegion.enabled=true \
  --set multiRegion.localRegion=us-east-1 \
  --set multiRegion.isPrimary=true
```

When a region goes down, reads are automatically served from healthy replicas. See [docs/architecture.md](docs/architecture.md) for the replication model.

## Observability

### Prometheus Metrics

```bash
curl http://localhost:5000/metrics
```

Key metrics:
- `registry10x_http_requests_total` -- request count by method, path, status
- `registry10x_http_request_duration_seconds` -- request latency histogram
- `registry10x_storage_operations_total` -- storage operations by backend
- `registry10x_auth_tokens_issued_total` -- token issuance count

Enable automatic scraping with Prometheus Operator:

```bash
helm install registry10x oci://ghcr.io/bwalia/charts/registry10x \
  --set serviceMonitor.enabled=true
```

### OpenTelemetry Tracing

```bash
helm install registry10x oci://ghcr.io/bwalia/charts/registry10x \
  --set observability.otlpEndpoint=http://otel-collector:4317 \
  --set observability.tracing.enabled=true
```

See [docs/observability.md](docs/observability.md) for Grafana dashboards and scrape configs.

## Image Vulnerability Scanning

Registry10x ships with a built-in CVE scanner (`registry10x-scanner` crate) that runs
on every push and exposes results over HTTP, WebSocket, and a dashboard panel.

### What gets scanned

| Layer | Parsers |
|---|---|
| OS packages | `dpkg` (Debian/Ubuntu), `apk` (Alpine), `rpm` (RHEL/Fedora/SUSE) |
| Language deps | `npm`, `pypi`, `cargo`, `go` modules |
| Loose binaries | ELF metadata fallback for un-packaged binaries |

The output is a CycloneDX SBOM plus a list of matched vulnerabilities.

### Vulnerability data sources

- **OSV** -- bootstrap source, queried directly for low-volume deploys.
- **Registry10xVulnDb** -- local Postgres mirror ingested from OSV, GitHub
  Security Advisories (GHSA), and NVD; ecosystem-aware version matchers
  (`apk`, `deb`, `rpm`, `pep440`, `semver`, Go pseudo-versions).
- **VEX** -- ingest CycloneDX VEX statements at `POST /v2/vex` to mark
  CVEs as `not_affected` / `fixed` / `under_investigation`.

### How it works

```text
manifest push → queue → puller → SBOM extract → vulndb match
              → suppression / VEX → policy gate → Redis (1h TTL)
              → optional AI analysis (Ollama) → notify (Slack / webhook)
```

1. Each successful manifest push enqueues a scan keyed by digest.
2. The worker pulls layers from object storage and walks each tarball
   for package metadata (no shell-out to Trivy/Grype).
3. Matched CVEs are filtered through suppressions and VEX statements.
4. A policy is evaluated (`PASS` / `FAIL` + violations) and the result
   is stashed in Redis with a 1-hour TTL, keyed by digest.
5. On demand, results can be re-rendered with AI commentary
   (Ollama), exported to S3, or posted as a PR review comment.

### Scanner endpoints

| Endpoint | Purpose |
|---|---|
| `GET /v2/scan/live/{digest}` | Poll-until-complete scan result |
| `POST /v2/scan` | Trigger a scan for a `(repo, tag)` |
| `GET /v2/scan/{id}` / `/report` / `/sbom` | Result, rendered report, CycloneDX SBOM |
| `GET /v2/scan/{id}/dockerfile-fix` | AI-suggested Dockerfile remediation |
| `POST /v2/scan/{id}/pr-comment` | Post results as a GitHub PR review comment |
| `GET /v2/ws/scan/{digest}` | WebSocket progress stream |
| `GET /v2/cve/search` | Cross-image CVE search |
| `POST /v2/cve/suppress` | Manage suppressions (with audit) |
| `POST /v2/policy/evaluate` | Standalone policy evaluation |
| `POST /v2/vex` | Ingest VEX statements |
| `POST /admin/vulndb/ingest` | Trigger an OSV/GHSA/NVD ingest run |
| `POST /v2/export/s3/{id}` | Export a scan to an S3 prefix |

All `/v2/scan/**` and `/admin/**` routes accept `Authorization: Bearer
nck_<secret>` API keys with per-permission scoping; legacy unauthenticated
calls fall through as a permissive `system` principal during migration.

### Nightly scan workflows

Three workflows live in `.github/workflows/`. All publish a Slack PDF on
completion (when `SLACK_BOT_TOKEN` + `SLACK_CHANNEL_ID` are set; falls
back to a webhook text post via `SLACK_WEBHOOK_URL`).

| Workflow | Trigger | Scope |
|---|---|---|
| [`nightly-cve-scan.yml`](.github/workflows/nightly-cve-scan.yml) | Manual dispatch | Compose stack + a fixed image list -- ad-hoc smoke test |
| [`nightly-cve-scan-all.yml`](.github/workflows/nightly-cve-scan-all.yml) | Cron `17 3 * * *` + dispatch | Enumerates `/v2/_catalog` and scans every `(repo, tag)` in the registry |
| [`deploy-nightly-cve-scan.yml`](.github/workflows/deploy-nightly-cve-scan.yml) | Push to `deploy/k8s/nightly-cve-scan/**` | Deploys the in-cluster k3s `CronJob` runner -- the production schedule |

The supporting scripts -- `scripts/nightly-scan-all.sh`,
`scripts/nightly-report-pdf.py`, `scripts/slack-upload-pdf.py` -- are the
same code path the in-cluster `CronJob` runs, so failures reproduce
locally with `bash scripts/nightly-scan-all.sh`.

## Production Install

### With OIDC and S3 Storage

```bash
helm install registry10x oci://ghcr.io/bwalia/charts/registry10x \
  --namespace registry10x --create-namespace \
  --set oidc.enabled=true \
  --set oidc.issuerUrl="https://accounts.google.com" \
  --set oidc.clientId="YOUR_CLIENT_ID" \
  --set oidc.clientSecret="YOUR_CLIENT_SECRET" \
  --set storage.backend=s3 \
  --set storage.s3.bucket=my-registry-bucket \
  --set storage.s3.region=us-east-1 \
  --set ingress.enabled=true \
  --set ingress.host=registry.example.com \
  --set ingress.tls.enabled=true
```

### Docker Hub Credentials (Avoid Rate Limits)

```bash
helm install registry10x oci://ghcr.io/bwalia/charts/registry10x \
  --set pullThroughCache.upstreams.docker\\.io.username=myuser \
  --set pullThroughCache.upstreams.docker\\.io.password=mytoken
```

See [docs/deployment.md](docs/deployment.md) for all deployment options.

## Configuration Reference

See [`config/registry10x.example.toml`](config/registry10x.example.toml) for all available settings.

### Storage Backends

| Backend | Value | Key Settings |
|---------|-------|-------------|
| Local filesystem | `filesystem` | `rootDirectory`, PVC size |
| Amazon S3 / MinIO | `s3` | `bucket`, `region`, `endpoint`, `encrypt` |
| Google Cloud Storage | `gcs` | `bucket`, `keyfile` |
| Azure Blob Storage | `azure` | `container`, `accountName` |

### Kubernetes CRDs

| CRD | Scope | Purpose |
|-----|-------|---------|
| `Tenant` | Cluster | Top-level org with quotas, IP restrictions, OIDC mapping |
| `Project` | Namespace | Groups repositories; sets visibility, retention, scanning policies |
| `AccessPolicy` | Namespace | Fine-grained RBAC with subjects, resources, actions, conditions |
| `TokenPolicy` | Namespace | Token lifetime, rotation, revocation, robot accounts |
| `ImageVerificationPolicy` | Namespace | Require cosign signatures on pull (`block` / `warn` / `log`) |

## Image Signing & Audit

Cosign-compatible signing and a tamper-evident audit log ship behind kill-switches
(default OFF). See [docs/design/001-image-signing.md](docs/design/001-image-signing.md)
and [docs/design/005-audit-log.md](docs/design/005-audit-log.md).

```bash
# Enable signing (Helm)
helm upgrade registry10x oci://ghcr.io/bwalia/charts/registry10x \
  --set signing.enabled=true \
  --set signing.requireForPull=false

# Sign a digest (after registry10x-sign keygen)
registry10x-sign sign --digest sha256:... --key file:///path/to/cosign.key --out sig.json

# Attach via API (or push the cosign sha256-<hex>.sig tag)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  --data-binary @sig.json \
  "https://registry.example.com/v2/myorg/myapp/signatures/sha256:..."
```

| Endpoint | Purpose |
|----------|---------|
| `POST/GET /v2/.../signatures/{digest}` | Upload or list signature artifacts |
| `POST /v2/_verify` | List or cryptographically verify signatures |
| `PUT /v2/_signing/policies/{tenant}/{name}` | Upsert an ImageVerificationPolicy (admin) |
| `GET /v2/_audit` / `POST /v2/_audit/verify` / `POST /v2/_audit/export` | Query, verify, and export the chained audit log |

## CI/CD Integration

Ready-to-use examples for all major CI/CD platforms:

| Platform | Example | Auth Method |
|----------|---------|-------------|
| GitHub Actions | [`examples/github-actions/push-image.yml`](examples/github-actions/push-image.yml) | OIDC (zero secrets) |
| GitLab CI | [`examples/gitlab-ci/push-image.yml`](examples/gitlab-ci/push-image.yml) | OIDC |
| Jenkins | [`examples/jenkins/Jenkinsfile`](examples/jenkins/Jenkinsfile) | Token-based |
| Tekton | [`examples/tekton/push-task.yml`](examples/tekton/push-task.yml) | ServiceAccount |
| ArgoCD | [`examples/argocd/image-updater.yml`](examples/argocd/image-updater.yml) | Image updater |

### GitHub Actions Example

```yaml
- name: Login to Registry10x
  uses: ./examples/github-actions/registry10x-login-action
  with:
    registry_url: registry.example.com
    tenant: my-org
    project: my-project

- name: Push image
  run: |
    docker build -t registry.example.com/my-org/my-project/app:${{ github.sha }} .
    docker push registry.example.com/my-org/my-project/app:${{ github.sha }}
```

## Docker Images

Registry10x is published to both Docker Hub and GHCR:

```bash
# Docker Hub
docker pull bwalia/registry10x:latest

# GitHub Container Registry
docker pull ghcr.io/bwalia/registry10x:latest
```

| Tag | Description |
|-----|-------------|
| `latest` | Latest stable release |
| `vX.Y.Z` | Specific version |
| `X.Y` | Major.minor version |
| `edge` | Latest dev build from main |

Multi-architecture: `linux/amd64` and `linux/arm64`.

## Project Structure

```
registry10x/
├── crates/
│   ├── registry10x-auth/          # Auth service binary
│   ├── registry10x-registry/      # Registry service binary
│   ├── registry10x-common/        # Shared library (models, auth, storage)
│   ├── registry10x-controller/    # Kubernetes CRD controller
│   ├── registry10x-mirror/        # Pull-through cache engine
│   ├── registry10x-resilience/    # Retry, circuit breaker, failover
│   ├── registry10x-replication/   # Multi-region replication
│   ├── registry10x-scanner/       # CVE scanner (SBOM, vulndb match, policy, AI)
│   ├── registry10x-signing/       # Cosign sign/verify (sigstore-rs, Vault/file keys)
│   ├── registry10x-audit/         # HMAC-chained registry audit log
│   ├── registry10x-db/            # Postgres migrations + vulndb store
│   └── registry10x-ai/            # Ollama client for CVE analysis + Dockerfile fixes
├── deploy/helm/registry10x/     # Helm chart
├── config/                   # Example configuration
├── docs/                     # Documentation (+ design/ Phase A–D plan)
├── docs/landing/             # Marketing landing pages (registry10x.org)
├── examples/                 # CI/CD and Kubernetes examples
└── docker-compose.yml        # Local development stack
```

## Building from Source

```bash
# Build all binaries
cargo build --workspace --release

# Run tests
cargo test --workspace

# Build Docker image
docker build -t registry10x:latest .

# Build optimized (distroless) image
docker build -f Dockerfile.scratch -t registry10x:scratch .
```

## Documentation

- [Architecture](docs/architecture.md)
- [Authentication](docs/authentication.md)
- [Multi-Tenancy](docs/multi-tenancy.md)
- [Deployment Guide](docs/deployment.md)
- [Observability](docs/observability.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Threat Model](docs/threat-model.md)
- [Security Audit Checklist](docs/security-audit-checklist.md)
- [System Architecture Diagrams](docs/system-architecture-diagrams.md)
- [Feature designs](docs/design/README.md) (signing, audit, promote, rebuild, …)
- [Phase A–D build lifecycle plan](docs/design/PHASE-A-D-BUILD-LIFECYCLE.md)
- [Landing / feature pages](docs/landing/)
- [Helm Chart Reference](deploy/helm/registry10x/README.md)
- [Configuration Reference](config/registry10x.example.toml)

## Website

Marketing / landing page. Served by `https://registry10x.org/` (primary),
with the S3 origin available for direct testing.

| Endpoint | URL |
|---|---|
| Primary | https://registry10x.org/ |
| GitHub Pages | https://bwalia.github.io/registry10x/landing/ |
| Test URL (object) | https://registry10x-docs.s3.eu-west-2.amazonaws.com/index.html |
| S3 website | http://registry10x-docs.s3-website.eu-west-2.amazonaws.com/ |
| Landing path | https://registry10x-docs.s3.eu-west-2.amazonaws.com/landing/index.html |

Source: [`docs/landing/`](docs/landing/) — auto-published on `main` pushes
via [`.github/workflows/publish-landing.yml`](.github/workflows/publish-landing.yml).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and pull request guidelines.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

Apache-2.0 -- see [LICENSE](LICENSE) for details.
