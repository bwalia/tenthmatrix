# Protect the website chatbot (time limit + abuse controls)

## Goal

Every public chatbot on our sites spends money on a paid LLM for anonymous visitors. Put the
same protection on each one that the Workstation shop chat now has
(`workstation-website/shop`, PR bwalia/workstation-website#371): **an anonymous visitor gets
5 minutes of chat from their first message, then a clear "to keep chatting, …" call to action**.
Plus the basic controls below, so a script or a curious visitor can't run up the bill.

Do this site by site. Start with **TenthMatrix** (`~/projects/tenthmatrix`); the same prompt
applies to **Workerra** (`~/projects/Workerra`, `src/modules/chatbot`) and any other site with
a `/api/chat` route. Read the repo's `CLAUDE.md` first and follow it. Match the surrounding code's
style, naming and comment density.

## Reference implementation (copy the approach, not the file)

Workstation shop, `shop/src/app/api/chat/route.ts`, `shop/src/lib/rate-limit.ts`,
`shop/src/lib/chat-limits.ts`, `shop/src/components/providers/ChatProvider.tsx`,
`shop/src/components/ChatPanel.tsx`:

- `chat-limits.ts` holds the numbers: `CHAT_FREE_MINUTES = 5`, `CHAT_FREE_RESET_HOURS = 24`,
  imported by the API route **and** by any page copy that states the limit (so copy and
  behaviour can't drift).
- `firstSeen(key, periodMs)` in the rate limiter: an in-memory map of key → first-message time;
  a new period starts once `periodMs` has passed since the last one began. Swept when the map
  grows past 10,000 keys.
- In the POST handler, after the existing burst rate limit and **before** any LLM call or
  session creation:
  ```ts
  const started = body.session_uuid ? firstSeen(`chat:free:s:${body.session_uuid}`, FREE_RESET_MS) : Date.now();
  if (Date.now() - started > FREE_MS) return jsonError(403, "CHAT_TIME_LIMIT", "<message>");
  ```
  **Per chat session only.** The first version also keyed on client IP and had to be rolled
  back (PR #372): on k3s1 the pod never sees the visitor's IP. Traffic goes edge → Traefik →
  `svclb-traefik` (SNAT), and `X-Forwarded-For`/`X-Real-IP` arrive as the svclb pod's address
  (`10.42.x.x`, confirmed with tcpdump). An IP key therefore made **every visitor share one
  5-minute clock**, blocking everyone for 24 hours once anyone had chatted for 5 minutes.
- Signed-in paying users (shop: active Trade members) skip the time limit and keep only a high
  fair-use ceiling that no person typing can reach.
- The client recognises `code === "CHAT_TIME_LIMIT"`, shows the server's message and the
  call-to-action buttons under it, and keeps errored turns out of the history it sends back.
- The limit is checked when a message is sent; a reply already streaming is not cut off.

## What to build on each site

1. **5-minute limit for anonymous visitors**, as above. Constants in one module; message and
   code `CHAT_TIME_LIMIT`, HTTP 403. Reset period 24 hours unless the site owner says otherwise.
2. **The call to action after the limit** is the site's conversion step, not a dead end:
   - TenthMatrix (enquiry chat, no accounts): "You've used your 5 minutes with our assistant.
     To keep talking, send us an enquiry or book a call — a person will reply." Buttons:
     **Send an enquiry** (the existing contact/lead flow; prefill what the chat already captured
     if the enquiry tool has it) and **Book a call** (the site's booking page). If an enquiry was
     already sent in this chat, say so instead and show only **Book a call**.
   - Workerra: sign up / sign in to keep chatting, if the product has accounts; otherwise the
     same enquiry wording.
   - Every UI string goes through the site's i18n (TenthMatrix has 12 locales: add the English
     string, then the translations per its `CLAUDE.md`; never hand-edit generated locale files).
3. **Keep or add the basic controls** (most already exist; check, don't duplicate):
   - Burst rate limit per client (TenthMatrix: 40 messages / 30 min per IP; Workerra: 20/min).
   - Max message length (TenthMatrix: 4,000 chars) and history capped server-side
     (`history.slice(-N)`), each history item validated (role ∈ user/assistant, string content,
     length cap). Never trust the client's history to be short.
   - `max_tokens` and a max tool-loop turn count per request (TenthMatrix: `maxTurns` 6).
   - The cheapest model that does the job (TenthMatrix already uses `claude-haiku-5-5`, effort
     low) — don't change the model as part of this work.
   - A kill switch (`CHAT_ENABLED=false` → 503 `CHAT_OFFLINE`, widget hidden).
4. **Find out what client IP the pod really sees before keying anything on it.** Capture the
   headers on the pod (ephemeral container, `kubectl debug <pod> --image=nicolaka/netshoot:v0.13
   --profile=netadmin -- tcpdump -i any -A -s0 'tcp port <app port>'`, then send a request,
   including one with a forged `X-Forwarded-For`). On k3s1 expect the svclb address
   (`10.42.x.x`), not the visitor's. If so:
   - **Do not** key the time limit on IP (see above).
   - The existing per-IP burst limit (TenthMatrix `IP_LIMIT` 40 / 30 min via `clientKey()`) is
     then effectively a **site-wide** limit: 40 messages per 30 minutes for all visitors combined
     through one hop. Replace it with a per-session burst limit plus a high site-wide ceiling as a
     cost cap, and say so in the PR.
   - Getting the real IP to pods is an infra change (Traefik `forwardedHeaders.trustedIPs` for the
     edge, `externalTrafficPolicy: Local` / no SNAT on the LB, the edge setting `X-Real-IP`). Write
     it up as a follow-up; don't do it in this PR.
   If the pod *does* see real client IPs, make sure the key can't be forged: TenthMatrix's
   `clientKey()` takes the *first* `X-Forwarded-For` value, which a visitor can set.
5. **Page copy** that describes the chat (terms, pricing, FAQ) states the limit from the
   constants.

## Known limits — state them in the PR, don't hide them

- Counting per session means a visitor who clears the chat (new session) gets another 5 minutes.
  That's the accepted trade-off until real client IPs reach the pods.
- In-memory state is per pod and lost on restart. With N replicas someone could get up to
  N × 5 minutes. Fine for now; say so. (Only add Redis/OpsAPI-backed state if the site already
  has a store the chat can use.)
- The clock starts at the first message the server sees, not when the widget opens.

## Tests and checks

- Unit tests for `firstSeen` (same key within the period returns the first time; after the
  period a new time; different keys independent) using an injectable clock if the limiter has one
  (Workerra's `createRateLimiter` takes `now`).
- Handler test: a visitor's message at t=0 is allowed; at t=5m+1s the same session gets 403
  `CHAT_TIME_LIMIT`; a **different** session at the same moment is still allowed (visitors must
  never share a clock); a signed-in member (where applicable) is still allowed.
- Run the repo's lint, typecheck, unit tests and i18n verify before opening the PR.

## Deploy and verify

1. Open a PR with a summary of the limits and the known per-pod caveat; merge when CI is green.
2. Deploy to int the repo's normal way. Verify with curl against int: send one message, wait
   5 minutes, then send one in the same session — it must return `403 CHAT_TIME_LIMIT` — and one
   with no session, which must still be allowed (otherwise visitors share a clock). Check the buttons in a browser at desktop and phone width.
3. Promote to test, acc and prod the repo's normal way (Ring Promoter where used; prod needs the
   owner's password — don't bypass it). Confirm the health check and image tag on each env.

## Done when

- Anonymous visitors are cut off 5 minutes after their first message, on every env, with a
  translated message and working call-to-action buttons.
- No limit is keyed on an IP the pod can't actually see; visitors never share a clock.
- Burst limit, message/history caps, max tokens/turns and the kill switch are all in place.
- The PR states the per-pod caveat.
