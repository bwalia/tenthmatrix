# Registry10x

A cloud-native Docker/OCI container registry built in Rust with multi-tenancy, zero-trust authentication, and pull-through caching.

## Quick Start

```bash
docker run -d -p 5000:5000 bwalia/registry10x:latest
```

Then push an image:

```bash
docker tag nginx:latest localhost:5000/myorg/nginx:latest
docker push localhost:5000/myorg/nginx:latest
```

## Key Features

- **OCI Distribution API v2** compliant
- **Pull-through cache** for Docker Hub, GHCR, GCR, Quay.io, registry.k8s.io
- **Multi-tenancy** with Tenant, Project, and AccessPolicy CRDs
- **Zero-trust auth** via OIDC (Google, GitHub Actions, GitLab CI, Azure AD)
- **Multiple storage backends** -- filesystem, S3, GCS, Azure Blob
- **High availability** -- stateless services, HPA, circuit breakers
- **Multi-region replication** with async/semi-sync modes
- **Observability** -- Prometheus metrics, JSON logging, OpenTelemetry tracing
- **Multi-architecture** -- linux/amd64 and linux/arm64

## Image Tags

| Tag | Description |
|-----|-------------|
| `latest` | Latest stable release |
| `vX.Y.Z` | Specific version |
| `edge` | Latest development build from main |

## Docker Compose

```yaml
services:
  registry:
    image: bwalia/registry10x:latest
    command: ["registry10x-registry"]
    ports:
      - "5000:5000"
      - "9090:9090"
    environment:
      REGISTRY10X_STORAGE__BACKEND: filesystem
      REGISTRY10X_STORAGE__ROOT: /var/lib/registry10x/data
      REGISTRY10X_AUTH__VERIFICATION_KEY_PATH: /etc/registry10x/keys/public.pem
    volumes:
      - registry-data:/var/lib/registry10x/data
```

See the full [docker-compose.yml](https://github.com/bwalia/tenthmatrix/blob/main/products/registry10x/docker-compose.yml) for a complete setup with auth and key generation.

## Kubernetes (Helm)

```bash
helm install registry10x oci://ghcr.io/bwalia/charts/registry10x \
  --namespace registry10x --create-namespace
```

## Ports

| Port | Service |
|------|---------|
| 5000 | OCI Registry API |
| 5001 | Auth / Token service |
| 9090 | Prometheus metrics |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REGISTRY10X_STORAGE__BACKEND` | `filesystem` | Storage backend (`filesystem`, `s3`, `gcs`, `azure`) |
| `REGISTRY10X_STORAGE__ROOT` | `/var/lib/registry10x/data` | Filesystem storage root |
| `REGISTRY10X_SERVER__LISTEN_ADDR` | `0.0.0.0:5000` | Registry listen address |
| `REGISTRY10X_AUTH__VERIFICATION_KEY_PATH` | -- | Path to JWT public key |
| `RUST_LOG` | `info` | Log level |

## Links

- [GitHub Repository](https://github.com/bwalia/tenthmatrix)
- [Documentation](https://github.com/bwalia/tenthmatrix/tree/main/products/registry10x/docs)
- [Helm Chart](https://github.com/bwalia/tenthmatrix/tree/main/products/registry10x/deploy/helm/registry10x)

## License

Apache-2.0
