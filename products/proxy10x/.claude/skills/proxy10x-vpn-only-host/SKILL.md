---
name: proxy10x-vpn-only-host
description: >-
  Make selected hostnames on a Proxy10x edge reachable only from a VPN (e.g.
  VPN10x / WireGuard) or a home/office LAN; everyone else gets 403 "VPN
  required". Uses Proxy10x access profiles. Use when the user asks to put
  int/test/preprod (or any host) "behind the VPN", "VPN-only", "LAN-only",
  "restrict <host> to our IP", or to lock a staging site to staff.
---

# VPN-only hosts on Proxy10x

Selected hosts answer only to clients whose address is in an allowed range;
everyone else gets 403 "VPN required". DNS stays public and certificates keep
renewing. Mechanism reference: [`docs/VPN_ACCESS.md`](../../../docs/VPN_ACCESS.md)
(§ Access profiles). Do not invent another mechanism.

## 1. Ask first — do not assume

1. **Base domain**, e.g. `example.com`.
2. **Which hosts** become VPN-only. If the user says "preprod", propose
   `int.<domain>` and `test.<domain>`; acc and prod stay public unless they
   say otherwise.
3. **Access profile name** to reuse or create. Look for an existing one first
   (`data/access_profiles/<env>/` on the edge and in the user's repo);
   otherwise propose `<product>-preprod`.
4. **Allowed CIDR(s)** as the edge sees them: the VPN's exit / NAT address or
   the office/home public IP, usually a `/32`. If unknown, read the existing
   profile before inventing one. Never guess.
5. **Origin** the allowed requests should go to — the same backend the host's
   current rule proxies to (`redirect_uri` of that rule). It must be explicit:
   without it the profile falls back to the server's `proxy_pass`, which is
   often `http://localhost`.
6. **Where the profile lives**: on the edge,
   `/opt/nginx/data/access_profiles/<env>/<name>.json` (`<env>` = the server's
   `profile_id`, usually `prod`), plus a reviewed copy in the user's repo next
   to their vhost specs.
7. **Confirm**: DNS stays public; ACME (`/.well-known/acme-challenge/`) stays
   reachable without VPN — it is a separate nginx location in front of the
   rules, so access profiles never block it. Don't add rules for it.

## 2. How it works

- Each VPN-only vhost (server JSON) gets `"access_profile": "<name>"`. Keep its
  existing `rules`, `match_cases`, `pop_ids` and SSL fields.
- Proxy10x expands the profile into allow/deny rule pairs per endpoint
  (`ap:<name>:<n>:allow|deny`, priority 1000+), above the host's normal rules.
- Profile shape (fields: `docs/VPN_ACCESS.md` § Fields):

  ```json
  {
    "name": "<profile-name>",
    "allow_cidrs": "<ip>/32",
    "origin": "http://<backend-host>:<port>",
    "endpoints": [{ "path": "/", "path_key": "starts_with" }]
  }
  ```

  Optional: per-endpoint `allow_cidrs` / `origin`, `deny_code`,
  `deny_message` (base64 HTML), and `groups` for VPN10x identity
  (§ Per-user access).
- **Profiles are loaded from disk only**, on the edge that serves the request.
- **Fail closed:** a missing, unreadable or invalid profile (or one with no
  origin) makes the host deny *every* request, logged as
  `access_profile failed, denying all requests for <host>: …`.
- **Prerequisite — real client IP:** rules match `remote_addr`. If anything sits
  in front of Proxy10x (a CDN, a load balancer), configure `data/real_ip/`
  first, or every request looks like the front proxy and is denied.

## 3. Do it, in this order

1. **Write the profile** in the user's repo and show the diff.
2. **Install the profile on every POP that serves the host — before any vhost
   references it.** Edge-sync mirrors `servers/`, `rules/`, `waf_policies/` and
   `secrets/` from the source edge to its mirrors, **not** `access_profiles/`.
   A vhost that reaches a mirror without its profile fails closed there. Copy
   the file to each edge's `/opt/nginx/data/access_profiles/<env>/`
   (owner/mode like its neighbours; `scp` may be disabled — stream over
   `ssh … 'cat > file'`).
3. **Patch each VPN-only vhost** with `"access_profile": "<name>"`, through the
   control plane first if one is used (`POST /api/projects/import` keeps ids),
   then on the source edge. Keep every other field. No reload is needed for
   rules or profiles.
4. **Never** put credentials in the profile or vhost, never add rules for ACME
   paths, never make DNS private.

## 4. Verify

```bash
# From the VPN / allowed LAN → origin answers (200/3xx)
curl -sI https://int.<domain>/ | head -1
# From anywhere else (or a GitHub ubuntu-latest runner) → 403 "VPN required"
curl -so /dev/null -w '%{http_code}\n' https://int.<domain>/
# Why a request was blocked
curl -sI https://int.<domain>/ | grep -iE '^x-(p10x-vpn|origin-ip)'
```

`X-P10X-VPN-Reason: client-ip-not-allowed` means the caller's address (shown in
`X-Origin-IP`) is outside `allow_cidrs`; `profile-load-failed` means step 2 was
missed on that POP. Health checks from hosted CI runners that expect 200 will
now get 403 — expected; run them from an allowed address or drop them.

## 5. Warn the user

- **Dynamic IPs:** a residential IP in `allow_cidrs` changes; when it does,
  everyone (including you) is locked out until the profile is updated.
- **Whole LAN:** allowing a home/office public IP admits every device behind it,
  not just VPN users. Prefer the VPN's own exit address or overlay range.
- **Bypass:** if the origin (port-forward, NodePort, public IP) is reachable
  directly from the internet, the profile can be bypassed. Firewall the origin to
  the edge's addresses.

## Output

- A short list of any answers still missing.
- The profile and vhost diffs.
- The exact copy/API commands per POP, in order (profile first).
- The verification commands for VPN vs public.
