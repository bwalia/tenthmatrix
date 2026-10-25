# Vault10x cutover: moving the live vault off bwalia/wslvault

Since 2026-10-25 Actions is off in `bwalia/wslvault`. The live vault
(vault.workstation.co.uk, vault-ha.workstation.co.uk) keeps running what was
last deployed. Ring Promoter (rp.workstation.co.uk, app `wslvault`) still
deploys and rolls back from wslvault release tags, so a rollback works; no new
version can be released until the cutover.

`deploy/ring-promoter/vault10x.yaml` is the replacement app. It now clones
bwalia/tenthmatrix and works in `products/vault10x/`, but before it replaces
the live `wslvault` app:

1. **Identifiers:** live release `wslvault` in namespaces `wslvault` /
   `wslvault-b`; this config installs release `vault10x` into `vault10x` /
   `vault10x-b`. Keep the live names or plan a migration.
2. **Versions:** it deploys `--branch <tag>` and image tags `<tag>`. Monorepo
   tags are the website's (`v1.0.N`), so Vault10x needs its own tag scheme
   (e.g. `vault10x-v1.0.N`) and an image build workflow at the repo root
   (ported from `.github/workflows/ci.yml`, which is inactive here).
3. **www:** `products-pages.yml` already publishes www.vault10x.com directly.
   The `vault10x-www` Ring Promoter app was never registered (seed returned 404)
   and is not needed.
