# Architecture

VPN10x is a self-hosted WireGuard Zero Trust access platform.

## Planes

```mermaid
flowchart TB
  subgraph endpoint [Endpoint Plane]
    Desktop[vpn10x-desktop]
    CLI[vpn10x-cli]
    Agent[vpn10x-agent]
    Desktop --> Agent
    CLI --> Agent
  end

  subgraph control [Control Plane]
    Control[vpn10x-control]
    PG[(PostgreSQL)]
    Control --> PG
  end

  subgraph data [Data Plane]
    Gateway[vpn10x-gateway]
    WG[WireGuard]
    Gateway --> WG
  end

  OpsAPI[OpsAPI] -->|service token| Control
  IdP[OIDC IdP] -->|PKCE| Control
  Git[GitOps] -->|apply| Control
  Agent -->|HTTPS| Control
  Gateway -->|register heartbeat| Control
  Agent -->|WireGuard| Gateway
```

## Components

| Component | Role |
|-----------|------|
| `vpn10x-control` | Identity, devices, policy, sessions, SCIM, OpsAPI provisioning, audit |
| `vpn10x-gateway` | WireGuard peers, routes, firewall, heartbeat |
| `vpn10x-agent` | Endpoint auth, device keys, posture, tunnel lifecycle |
| `vpn10x-cli` | Operator/user CLI over agent IPC |
| `vpn10x-desktop` | Thin macOS UI over agent |

## Security boundaries

- Control plane is authoritative for access decisions (fail-closed).
- Gateways apply only versioned peer configs from the control plane.
- Private keys never leave secure storage (Keychain / 0600 file fallback for dev).
- Sessions are short-lived; expiry or revoke removes peers.

## Product namespace

Display name: **VPN10x**. Internal crate prefix: `vpn10x_*`. Config key `product.namespace` (default `vpn10x`) allows rebrand without architecture changes.
