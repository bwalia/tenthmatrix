# VPN10x

**The Zero Trust security layer for AI-assisted development and work.** VPN10x is a lightweight, self-hosted, WireGuard-based access platform: people sign in with SSO, their device is registered and its posture checked, and policy decides which private networks it can reach.

AI-assisted work widens what a laptop can touch: coding agents run on developer machines with the same network access as the person, and reach private repositories, staging, internal APIs, model endpoints and MCP servers. VPN10x keeps those services off the public internet and gives each group only the networks its policy allows, with device posture checked at session start, an audit trail of every session, and revocation that takes effect at the tunnel.

**With [Proxy10x](../proxy10x/).** VPN10x decides who and which device is on the overlay; Proxy10x, at the edge, decides what each of them can reach. Proxy10x access profiles match the overlay address, resolve it to the VPN10x session identity (user, groups) and allow or deny per route, passing the verdict on as `X-P10X-VPN*` headers. See [`products/proxy10x/docs/VPN_ACCESS.md`](../proxy10x/docs/VPN_ACCESS.md).

> Install the client → sign in with SSO → device is registered → posture is evaluated → policy determines access → WireGuard connects automatically.

Part of the [TenthMatrix](https://www.tenthmatrix.com) product family; lives in the TenthMatrix monorepo at `products/vpn10x/`. Product domain (planned): vpn10x.com.

> **CI is not wired yet.** The workflows under [`.github/workflows/`](.github/workflows/) were carried over but are inactive: GitHub only runs workflows from the repository root. Port them into the root `.github/workflows/` with a `paths: ['products/vpn10x/**']` filter and `working-directory: products/vpn10x`.

## Components

- `vpn10x-control` — Rust control plane (Axum + PostgreSQL)
- `vpn10x-gateway` — WireGuard data plane
- `vpn10x-agent` / `vpn10x-cli` — endpoint agent and CLI
- `vpn10x-desktop` — the desktop app for macOS, Linux and Windows, over the CLI ([install](docs/INSTALL.md))
- `vpn10x-ios` — iPhone and iPad client with its own packet tunnel

## Quick start (local)

```bash
make dev
```

This starts PostgreSQL (host port **5433**), Dex (OIDC), control plane, and gateway via Docker Compose.

For a host-run control plane against Compose Postgres:

```bash
DATABASE_URL=postgres://vpn10x:vpn10x@localhost:5433/vpn10x cargo run -p vpn10x-control
cargo run -p vpn10x-cli -- login --dev --email alice@example.com
cargo run -p vpn10x-cli -- connect --network development
cargo run -p vpn10x-cli -- status
```

`connect` brings the WireGuard interface up, which needs `wg-quick`
(`brew install wireguard-tools`) and root — it re-runs itself under `sudo` and
may prompt. Pass `--no-tunnel` to create the session and write the config
without touching the interface. See [Client](docs/CLIENT.md).

## Production

The control plane is deployed with the Helm chart in `deploy/helm/vpn10x`:

```bash
helm upgrade --install vpn10x oci://ghcr.io/bwalia/charts/vpn10x \
  --namespace vpn10x --create-namespace \
  --set config.publicUrl=https://vpn.example.com \
  --set ingress.host=vpn.example.com \
  --set config.oidc.issuer=https://idp.example.com \
  --set 'config.adminEmails[0]=security@example.com'
```

Secrets are referenced from a `Secret`, never templated into the chart. On a
fresh database, `config.adminEmails` is the only way an administrator comes into
existence — leave it empty and nobody can reach the administrative API.

See [Operations](docs/OPERATIONS.md) for the bootstrap checklist, backup and
restore, and the runbooks.

## Testing

```bash
make test
```

The control-plane authorization tests drive the real router against a real
database, so `make test` brings a throwaway PostgreSQL up first.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Install](docs/INSTALL.md) · [Client](docs/CLIENT.md) · [Desktop](docs/DESKTOP.md) · [DNS overrides](docs/DNS.md) · [iOS](docs/IOS.md) · [Posture](docs/POSTURE.md)
- [Authorization](docs/AUTHORIZATION.md)
- [Security](docs/SECURITY.md) · [Threat model](docs/THREAT-MODEL.md)
- [Operations](docs/OPERATIONS.md) · [Upgrading](docs/UPGRADING.md) · [Troubleshooting](docs/TROUBLESHOOTING.md)
- [GitOps](docs/GITOPS.md)
- [API](docs/API.md)
- [OpsAPI integration](docs/OPSAPI.md) · [SCIM](docs/SCIM.md) · [OIDC](docs/OIDC.md)
- [Implementation plan](docs/IMPLEMENTATION-PLAN.md)
- [Decisions](docs/decisions/)

## License

Apache-2.0
