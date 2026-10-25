# Proxy10x cutover: moving the live control plane off bwalia/wslproxy

Since 2026-10-25 every workflow in `bwalia/wslproxy` is disabled except the two
backups (**Backup WSLProxy Data**, **Sync Prod Data to S3**). The live control
plane (cp.pop0.uk) keeps running what wslproxy last deployed, and Ring Promoter
(rp.wslproxy.com, app `wslproxy-k3s1`) can still roll it back to an existing
wslproxy commit. Nothing in this repo deploys it yet.

The deploy workflows have been ported to the repo root and are frozen behind the
repo variable `PROXY10X_CUTOVER` (unset):

| Old (bwalia/wslproxy) | Here |
|---|---|
| `deploy-control-plane-k3s1.yml` | `.github/workflows/proxy10x-deploy-control-plane.yml` |
| `deploy-ring-promoter.yml` | `.github/workflows/proxy10x-deploy-ring-promoter.yml` |

Both run on the k3s1 autoscaling runners (`k3s-linux`).

## Before setting `PROXY10X_CUTOVER=true`

1. **Identifiers.** The rebrand renamed names the live cluster uses. Pick, per
   row, keep-the-live-name (treat it as a protocol constant, like Vault10x's
   `wslvault:` labels) or migrate (parallel install, then move traffic):

   | Live | In this repo |
   |---|---|
   | namespace `wslproxy-system`, release `wslproxy-ingress` | `proxy10x-system`, `proxy10x-ingress` |
   | IngressClass `wslproxy`, controller `wslproxy.io/ingress-controller` | `proxy10x`, `proxy10x.io/ingress-controller` |
   | CRD group `wslproxy.io` | `proxy10x.io` (`ingress-controller/deploy/crds/`) |
   | Secret `ring-exec/wslproxy-vault` | `ring-exec/proxy10x-vault` |
   | Ring Promoter instance `wslproxy-ring-promoter` (rp.wslproxy.com), app `wslproxy-k3s1` | `proxy10x-ring-promoter` (rp.proxy10x.com), `proxy10x-k3s1` |
   | images `bwalia/wslproxy`, `bwalia/wslproxy-admin-next` | `bwalia/proxy10x`, `bwalia/proxy10x-admin-next` |
   | Vault env / settings keys read by `scripts/k3s1-bootstrap-control-plane.sh` | renamed `PROXY10X_*` |

   Seeding the frozen workflow as-is would install a second control plane
   in `proxy10x-system` and re-apply the cp.pop0.uk Traefik route.
2. **Secrets on bwalia/tenthmatrix:** `RP_URL`, `RP_TOKEN`
   (`<rp namespace>/ring-promoter` key `RP_API_TOKEN`), optional
   `RP_PROD_PASSWORD`. Docker and kubeconfig secrets already exist.
3. **bwalia/ring-promoter** `deploy-k3s1.yml` sends `repository_dispatch`
   `ring-promoter-image` to bwalia/wslproxy; point it at bwalia/tenthmatrix.
4. **Backups:** port `backup-proxy10x-data.yml` and `sync-prod-data-to-s3.yml`
   (and their secrets), confirm one run of each, then disable the two still
   running in bwalia/wslproxy.
5. Set `PROXY10X_CUTOVER=true` and run `proxy10x-deploy-ring-promoter.yml`,
   then `proxy10x-deploy-control-plane.yml`, by hand the first time.
