# 0005 — OpsAPI namespace roles gate access

**Status:** accepted
**Date:** 2026-10-26
**Builds on:** [ADR-0004](0004-sign-in-with-opsapi-by-asking-opsapi.md)

## Context

ADR-0004 admits anyone who is an active member of the configured OpsAPI
workspace. A workspace holds more people than should reach the network —
bookkeepers, contractors with a CRM login, customers given a portal account — and
OpsAPI already says what each of them is there: namespace roles
(`namespace_roles`, granted per membership in `namespace_user_roles`). The
operator wants to name the roles that open the VPN, in OpsAPI, where the rest of
access is managed.

The obvious source does not have the answer. Read in OpsAPI's source
(`lapis/routes/auth.lua`, `lapis/routes/namespaces.lua`):

| Endpoint | What it says about roles |
|---|---|
| `GET /auth/me` | `user.roles` are *platform* roles; `namespaces[]` carries no per-workspace roles |
| `GET /api/v2/user/namespaces` | per-workspace roles, but for a platform administrator it lists *every* workspace as `owner` — a view, not a membership anyone granted |
| `GET /api/v2/user/{uuid}/namespace-memberships` | the real memberships — `status`, `is_owner`, `namespace_slug`, `namespace_status` and `roles: [{id, role_name, display_name}]` (null when none) — for platform administrators too |

The last one is `requireAuth`, and answers only the person themself or a
platform administrator. An `opsk_` key reaching it must also be scoped to the
`user` module: `helper/api-key.lua` `permits_uri` confines a key to the
`/api/v2/<module>` prefixes it carries.

## Decision

**When `identity.opsapi.allowed_roles` is set, a person must hold one of those
namespace roles in the configured workspace, read from
`namespace-memberships`, at sign-in and again on every connect.**

1. At sign-in, after `/auth/me`, the control plane asks
   `namespace-memberships` for the person's uuid **with the person's own
   token** — OpsAPI's own rule lets them read their own memberships, so the
   deployment's key needs nothing extra for this step. The membership counted
   is the one whose slug is the configured workspace, with `status` active and
   the workspace active (or not reported). No allowed role → 401.
2. On every `POST /api/v1/sessions`, after the directory says the person is active, the
   same lookup is made **with the deployment's key**. No allowed role → 403,
   audited as `opsapi: role not allowed in workspace` — distinct from
   `opsapi: user not active in directory`, so the audit log says which of the
   two took the person out.
3. Role names are compared case-insensitively. A workspace owner counts as
   holding `owner`, because an owner need not have any role row.
4. Any failure to get an answer — OpsAPI unreachable, a 5xx, our key refused —
   is a 503, never an allow. A refused key is reported as the deployment's
   fault, pointing at the `user` scope and the platform-administrator owner.
5. Empty `allowed_roles` (the default) asks nothing new: membership admits, as
   under ADR-0004.

`/auth/methods` says `roles_required: true|false` so a client can explain a
refusal; the role names themselves are not published.

## Consequences

- Taking a role away in OpsAPI stops that person's next connection, not
  whenever their VPN10x token expires. Sessions already up are not cut by it;
  that is still revocation's job.
- The connect path makes two OpsAPI calls instead of one when roles are on. Both
  are bounded by the same timeout and fail closed.
- The deployment's key gains a scope: `user` on top of `users`, which the directory check needs. It
  already belonged to a platform administrator, so this widens which paths it
  may reach, not whose authority it carries. It stays in the Secret and is never
  sent to clients.
- The response is read defensively — top level or under `data`, `roles` as an
  array, null, or a JSON string (Postgres `json_agg` through Lapis can arrive
  either way) — because, as ADR-0003 notes, OpsAPI publishes no usable contract
  for it.
- `verify_on_connect: false` turns off this re-check along with the directory one;
  roles are then checked at sign-in only.

## Also decided here: the directory check leaves SCIM

Testing against a running OpsAPI showed that ADR-0004's directory check could
never have passed with a real key: OpsAPI's global filter confines an `opsk_`
key to `/api/v2/<module>` paths it is scoped for, and `/scim/v2/Users/{uuid}`
is not one, so every valid key is answered `403 API key is not scoped for this
endpoint` (ADR-0004 had only confirmed that a *bad* key gets 401). The same
record — `active` and `email` — comes from `GET /api/v2/users/{uuid}`, which a
key bound to a platform administrator and scoped to `users` may read. The
check, its answers and its failure modes are otherwise unchanged.
