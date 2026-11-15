#!/usr/bin/env python3
"""Draw the Microsoft Graph technical-note diagrams (our own drawings, no Microsoft artwork).

Run from the repo root: python3 scripts/content/microsoft-graph/diagrams.py
Writes public/img/microsoft-graph/*.svg
"""
from pathlib import Path
from xml.sax.saxutils import escape as e

OUT = Path(__file__).resolve().parents[3] / "public/img/microsoft-graph"
SANS = "Poppins, system-ui, -apple-system, 'Segoe UI', sans-serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, monospace"
INK, MUTED, LINE = "#0d1d21", "#5b6d72", "#44565b"
C = {
    "": ("#ffffff", "#d3dedb"),
    "grey": ("#eef2f1", "#8a9a9e"),
    "graph": ("#e3eefc", "#1f63c6"),
    "entra": ("#ece9fb", "#5847c2"),
    "exo": ("#e1f1fb", "#0f7bb8"),
    "spo": ("#ddf1ec", "#00806b"),
    "teams": ("#f6e6f7", "#9a3aa6"),
    "intune": ("#fcefd9", "#a85f00"),
    "sec": ("#fde7e7", "#c2373a"),
    "tasks": ("#e8f4dc", "#3f7d1d"),
    "purview": ("#e9eef8", "#3f5a8f"),
}


class Svg:
    def __init__(self, w, h, title):
        self.w, self.h, self.title, self.parts = w, h, title, []

    def add(self, s):
        self.parts.append(s)

    def box(self, x, y, w, h, title, lines=(), v="", rx=8, tsize=14, lsize=11.5, align="middle", mono_lines=True, sw=1.4):
        f, s = C[v]
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{f}" stroke="{s}" stroke-width="{sw}"/>')
        n = (1 if title else 0) + len(lines)
        lh = lsize + 5.5
        sy = y + h / 2 - ((n - 1) * lh) / 2 + 5
        tx = x + w / 2 if align == "middle" else x + 14
        i = 0
        if title:
            self.add(f'<text x="{tx}" y="{sy}" text-anchor="{align}" fill="{INK}" font-family="{SANS}" font-size="{tsize}" font-weight="600">{e(title)}</text>')
            i = 1
        for j, l in enumerate(lines):
            fam = MONO if mono_lines else SANS
            self.add(f'<text x="{tx}" y="{sy + lh * (i + j)}" text-anchor="{align}" fill="{MUTED}" font-family="{fam}" font-size="{lsize}">{e(l)}</text>')

    def text(self, x, y, t, size=11.5, anchor="start", mono=True, col=MUTED, weight="400"):
        self.add(f'<text x="{x}" y="{y}" text-anchor="{anchor}" fill="{col}" font-family="{MONO if mono else SANS}" font-size="{size}" font-weight="{weight}">{e(t)}</text>')

    def arrow(self, pts, col=LINE, dash=False, w=1.5, head=True):
        d = ' stroke-dasharray="6 4"' if dash else ""
        m = ' marker-end="url(#ah)"' if head and col == LINE else (' marker-end="url(#ahb)"' if head else "")
        p = " ".join(f"{x},{y}" for x, y in pts)
        self.add(f'<polyline points="{p}" fill="none" stroke="{col}" stroke-width="{w}"{d}{m}/>')

    def badge(self, x, y, n, col="#1f63c6"):
        self.add(f'<circle cx="{x}" cy="{y}" r="11" fill="{col}"/>')
        self.add(f'<text x="{x}" y="{y + 4}" text-anchor="middle" fill="#ffffff" font-family="{SANS}" font-size="12" font-weight="700">{n}</text>')

    def write(self, name):
        defs = (
            '<defs>'
            f'<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{LINE}"/></marker>'
            '<marker id="ahb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#1f63c6"/></marker>'
            '</defs>'
        )
        svg = (
            f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" width="{self.w}" height="{self.h}" role="img">'
            f'<title>{e(self.title)}</title>{defs}<rect width="{self.w}" height="{self.h}" fill="#ffffff"/>' + "".join(self.parts) + "</svg>\n"
        )
        (OUT / name).write_text(svg, encoding="utf-8")


BLUE = "#1f63c6"

# 1. End-to-end workflow -----------------------------------------------------
s = Svg(1200, 700, "Microsoft Graph end to end: register the app in Microsoft Entra ID, get a token from the Microsoft identity platform, call graph.microsoft.com, which checks the token, permissions and throttling before routing to Entra ID, Exchange Online, SharePoint and OneDrive, Teams, Intune, Security, Planner and To Do or Purview; changes flow back through webhooks, Event Hubs or Event Grid, delta query and Data Connect")
s.text(20, 30, "1  YOUR CODE", 12, col=INK, weight="600")
s.text(300, 30, "2  SIGN-IN", 12, col=INK, weight="600")
s.text(525, 30, "3  ONE ENDPOINT", 12, col=INK, weight="600")
s.text(845, 30, "4  THE SERVICES BEHIND IT", 12, col=INK, weight="600")
s.box(20, 48, 210, 120, "Your app", ["web app · daemon · script", "AI agent · PowerShell", "SDK: C#, Java, Go, JS,", "Python, PHP, CLI"], "")
s.box(20, 196, 210, 150, "App registration", ["Microsoft Entra admin center", "client ID", "credential: certificate,", "federated identity or secret", "API permissions + consent"], "entra")
s.arrow([(125, 168), (125, 194)], dash=True, head=True)
s.box(300, 48, 200, 150, "Microsoft identity", ["platform", "login.microsoftonline.com", "/{tenant}/oauth2/v2.0/token", "MSAL handles caching", "and refresh"], "entra")
s.box(300, 222, 200, 58, "Delegated", ["user signs in · scopes (scp)"], "", tsize=13)
s.box(300, 290, 200, 58, "App-only", ["client credentials · roles"], "", tsize=13)
s.text(400, 368, "app-only scope: …/.default", 10, "middle")
# arrows app <-> identity
s.arrow([(230, 80), (298, 80)])
s.badge(265, 66, 1)
s.arrow([(300, 120), (232, 120)])
s.badge(265, 106, 2)
# Graph gateway
s.add(f'<rect x="525" y="48" width="270" height="420" rx="10" fill="#f4f8fe" stroke="{BLUE}" stroke-width="1.6" stroke-dasharray="7 4"/>')
s.text(660, 72, "https://graph.microsoft.com", 12.5, "middle", col=BLUE, weight="600")
s.text(660, 90, "/v1.0 (production) · /beta (preview)", 10.5, "middle")
gs = [
    ("Validate the token", "audience, tenant, expiry"),
    ("Check permissions", "scopes (scp) or app roles"),
    ("Throttle fairly", "per app and tenant · 429"),
    ("Route to the service", "/users  /me/messages  /sites  /teams"),
    ("Shape the result", "$select $filter $top · paging"),
]
for i, (t, l) in enumerate(gs):
    y = 104 + i * 70
    s.box(540, y, 240, 56, t, [l], "graph", tsize=13, lsize=10.5)
    if i:
        s.arrow([(660, y - 14), (660, y - 2)])
s.arrow([(230, 155), (270, 155), (270, 420), (523, 420)], col=BLUE)
s.badge(270, 395, 3)
s.text(400, 412, "HTTPS + Authorization: Bearer", 10.5, "middle", col=BLUE)
# services
svc = [
    ("Microsoft Entra ID", "users, groups, apps, sign-ins", "entra"),
    ("Exchange Online", "mail, calendar, contacts", "exo"),
    ("SharePoint + OneDrive", "sites, lists, files", "spo"),
    ("Microsoft Teams", "teams, channels, chats, calls", "teams"),
    ("Microsoft Intune", "devices, apps, policies", "intune"),
    ("Security", "Defender alerts, incidents, ID Protection", "sec"),
    ("Planner + To Do", "plans, tasks", "tasks"),
    ("Microsoft Purview", "eDiscovery, information protection", "purview"),
]
for i, (t, l, v) in enumerate(svc):
    y = 48 + i * 53
    s.box(845, y, 335, 45, "", [], v, rx=7)
    s.text(860, y + 20, t, 13, mono=False, col=INK, weight="600")
    s.text(860, y + 36, l, 10.5)
# fan-out
for i in range(8):
    y = 70 + i * 53
    s.arrow([(795, 382), (820, 382), (820, y), (843, y)], w=1.1, head=True)
s.badge(808, 360, 4)
# response
s.arrow([(525, 448), (248, 448), (248, 170), (232, 170)], dash=True)
s.badge(400, 448, 5)
s.text(400, 470, "JSON response · request-id · @odata.nextLink", 10.5, "middle")
# bottom: data out lanes
s.text(20, 515, "5  CHANGES AND BULK DATA FLOW BACK OUT", 12, col=INK, weight="600")
outs = [
    (20, "Change notifications", ["subscribe to a resource", "basic · rich · lifecycle"], "graph"),
    (310, "Webhook", ["your HTTPS endpoint", "validate in 10 s · ack in 3 s"], ""),
    (540, "Azure Event Hubs / Event Grid", ["for high volume or", "slow consumers"], ""),
    (830, "Data Connect", ["scheduled bulk copy into", "Fabric · Synapse · Data Factory"], "spo"),
]
for x, t, l, v in outs:
    w = 250 if x == 20 else (210 if x == 310 else (270 if x == 540 else 350))
    s.box(x, 532, w, 72, t, l, v, tsize=13, lsize=10.5)
s.arrow([(270, 568), (308, 568)])
s.arrow([(520, 568), (538, 568)])
s.box(20, 622, 250, 58, "Delta query", ["/users/delta · deltaLink"], "graph", tsize=13, lsize=10.5)
s.text(290, 645, "Pull only what changed since last time. Notifications say when, delta says what.", 11.5, mono=False, col=INK)
s.text(290, 665, "Data Connect is for whole datasets on a schedule; the API is for real-time, per-user or per-tenant calls.", 11.5, mono=False, col=MUTED)
s.arrow([(1005, 468), (1005, 530)], dash=True)
s.write("graph-end-to-end-workflow.svg")

# 2. The graph of resources ---------------------------------------------------
g = Svg(1200, 760, "The graph in Microsoft Graph: a user connected to messages, events, drive, joined teams, groups, manager, managed devices, To Do lists and people, each reached by a path under /me, with tenant-wide resources listed below")
g.box(330, 18, 540, 46, "", [], "graph", rx=23)
g.text(600, 47, "GET https://graph.microsoft.com/v1.0/me/{relationship}", 13, "middle", col=BLUE, weight="600")
cx, cy = 600, 360
nodes = [
    (300, 170, "messages", "/me/messages", "exo"),
    (600, 140, "events", "/me/events", "exo"),
    (900, 170, "drive", "/me/drive/root/children", "spo"),
    (1040, 350, "joinedTeams", "/me/joinedTeams", "teams"),
    (900, 530, "todo", "/me/todo/lists", "tasks"),
    (600, 560, "devices", "/me/managedDevices", "intune"),
    (300, 530, "manager", "/me/manager", "entra"),
    (160, 350, "memberOf", "/me/memberOf", "entra"),
]
for x, y, t, p, v in nodes:
    g.add(f'<line x1="{cx}" y1="{cy}" x2="{x}" y2="{y}" stroke="#9fb0b4" stroke-width="2"/>')
# secondary relationships
sec = [((1040, 350), (1095, 215), "channels", "/teams/{id}/channels", "teams"),
       ((160, 350), (95, 200), "group", "/groups/{id}", "entra"),
       ((900, 170), (1080, 100), "site", "/sites/{id}", "spo")]
for (ax, ay), (bx, by), t, p, v in sec:
    g.add(f'<line x1="{ax}" y1="{ay}" x2="{bx}" y2="{by}" stroke="#c9d4d6" stroke-width="1.6" stroke-dasharray="5 4"/>')
for x, y, t, p, v in nodes:
    f, st = C[v]
    g.add(f'<circle cx="{x}" cy="{y}" r="46" fill="{f}" stroke="{st}" stroke-width="2"/>')
    g.text(x, y + 5, t, 12.5 if len(t) < 12 else 11, "middle", mono=False, col=INK, weight="600")
    g.text(x, y + 66, p, 11, "middle", col=st)
for (ax, ay), (bx, by), t, p, v in sec:
    f, st = C[v]
    g.add(f'<circle cx="{bx}" cy="{by}" r="34" fill="{f}" stroke="{st}" stroke-width="1.6"/>')
    g.text(bx, by + 4, t, 11.5, "middle", mono=False, col=INK, weight="600")
    g.text(bx, by - 42, p, 10, "middle", col=st)
g.add(f'<circle cx="{cx}" cy="{cy}" r="70" fill="#1f63c6"/>')
g.text(cx, cy - 4, "user", 18, "middle", mono=False, col="#ffffff", weight="700")
g.text(cx, cy + 18, "/me  ·  /users/{id}", 11, "middle", col="#dbe8fb")
# legend
leg = [("Entra ID", "entra"), ("Exchange Online", "exo"), ("SharePoint / OneDrive", "spo"), ("Teams", "teams"), ("Intune", "intune"), ("To Do", "tasks")]
x = 70
for t, v in leg:
    f, st = C[v]
    g.add(f'<circle cx="{x}" cy="668" r="8" fill="{f}" stroke="{st}" stroke-width="2"/>')
    g.text(x + 14, 672, t, 12, mono=False, col=INK)
    x += 30 + len(t) * 7.6 + 20
g.box(20, 692, 1160, 52, "", [], "grey", rx=8)
g.text(36, 714, "Tenant-wide, usually with application permissions:", 12, mono=False, col=INK, weight="600")
g.text(36, 734, "/users   /groups   /applications   /auditLogs/signIns   /security/alerts_v2   /deviceManagement/managedDevices   /sites   /reports", 11.5)
g.write("graph-resource-map.svg")

# 3. Keeping in sync ----------------------------------------------------------
k = Svg(1200, 470, "Keeping data in sync with Microsoft Graph: first a full delta sync, then a subscription validated within 10 seconds, notifications acknowledged within 3 seconds and queued, a delta call fetches the changes, and the subscription is renewed before it expires")
k.text(20, 28, "FIRST RUN", 12, col=INK, weight="600")
k.box(20, 42, 230, 78, "Full sync with delta", ["GET /users/delta", "follow @odata.nextLink"], "graph", lsize=10.5)
k.box(290, 42, 230, 78, "Save the deltaLink", ["last page returns", "@odata.deltaLink"], "", lsize=10.5)
k.box(560, 42, 290, 78, "Create a subscription", ["POST /subscriptions", "resource, changeType, clientState,", "notificationUrl, expirationDateTime"], "graph", lsize=10.5)
k.box(890, 42, 290, 78, "Graph validates the URL", ["POST ?validationToken=…", "reply 200, text/plain, the token", "within 10 seconds"], "sec", lsize=10.5)
k.arrow([(250, 81), (288, 81)])
k.arrow([(520, 81), (558, 81)])
k.arrow([(850, 81), (888, 81)])
k.text(20, 170, "EVERY CHANGE AFTER THAT", 12, col=INK, weight="600")
loop = [
    (20, "Change happens", ["user updated, mail", "arrives, file edited"], "entra"),
    (260, "Notification arrives", ["value[]: subscriptionId,", "changeType, clientState"], "graph"),
    (500, "Check and queue", ["clientState matches?", "reply 202 within 3 s"], "spo"),
    (740, "Worker calls delta", ["GET saved deltaLink", "apply adds, edits, @removed"], "graph"),
    (980, "Store new deltaLink", ["ready for the", "next notification"], ""),
]
for x, t, l, v in loop:
    k.box(x, 186, 200, 78, t, l, v, lsize=10.5)
for i in range(4):
    x = 220 + i * 240
    k.arrow([(x, 225), (x + 38, 225)])
k.arrow([(1080, 264), (1080, 300), (360, 300), (360, 266)], dash=True)
k.text(720, 318, "repeat for every notification", 10.5, "middle")
k.text(20, 360, "IN THE BACKGROUND", 12, col=INK, weight="600")
bg = [
    (20, "Renew before expiry", ["PATCH /subscriptions/{id}", "e.g. Teams chats: 3 days"], "intune"),
    (310, "Lifecycle notifications", ["reauthorization required,", "missed notifications"], "intune"),
    (600, "410 Gone on delta", ["token expired or reset:", "run a full sync again"], "sec"),
    (890, "Endpoint too slow?", ["deliver to Event Hubs or", "Event Grid instead"], ""),
]
for x, t, l, v in bg:
    k.box(x, 376, 270, 78, t, l, v, lsize=10.5)
k.write("graph-sync-workflow.svg")

# 4. Scale: batching and throttling ------------------------------------------
t = Svg(1200, 420, "Calling Microsoft Graph at scale: combine up to 20 requests in one $batch call, read each response by id, retry only the items that returned 429 after the Retry-After delay, and move whole-tenant exports to Data Connect")
t.box(20, 40, 250, 150, "POST /v1.0/$batch", ["up to 20 requests", "each with id, method, url", "dependsOn for order", "one HTTP round trip"], "graph", lsize=10.5)
t.box(320, 40, 250, 150, "Batch answers 200", ["responses[] by id,", "in any order", "200 means parsed,", "not that each succeeded"], "", lsize=10.5)
t.arrow([(270, 115), (318, 115)])
res = [(620, 40, "201 / 200", "done", "spo"), (620, 92, "424", "a dependency failed", "intune"), (620, 144, "429", "throttled: Retry-After: 10", "sec")]
for x, y, a, b, v in res:
    t.box(x, y, 280, 44, "", [], v, rx=7)
    t.text(x + 14, y + 27, a, 13, mono=False, col=INK, weight="600")
    t.text(x + 80, y + 27, b, 10.5)
for y in (62, 114, 166):
    t.arrow([(570, 115), (595, 115), (595, y), (618, y)], w=1.2)
t.box(930, 120, 250, 70, "Wait, then retry only", ["the 429 items; SDKs do this", "for single calls, not in batches"], "sec", lsize=10.5)
t.arrow([(900, 166), (928, 166)])
t.arrow([(1055, 120), (1055, 20), (145, 20), (145, 38)], dash=True)
t.text(600, 14, "next batch", 10.5, "middle")
t.text(20, 236, "WHAT GRAPH LIMITS", 12, col=INK, weight="600")
lim = [
    (20, "Per app, all tenants", ["130,000 requests", "per 10 seconds"], "graph"),
    (310, "Identity per app + tenant", ["3,500 to 8,000 resource", "units per 10 s by tenant size"], "entra"),
    (600, "Intune per app + tenant", ["1,000 requests per 20 s;", "writes 100 per 20 s"], "intune"),
    (890, "Writes", ["4 MB per request;", "413 if larger"], ""),
]
for x, tt, l, v in lim:
    t.box(x, 252, 270, 70, tt, l, v, lsize=10.5)
t.text(20, 356, "Cheaper calls: $select fewer properties, page with $top, use delta instead of polling, and batch related reads.", 12, mono=False, col=INK)
t.text(20, 378, "Whole-tenant exports belong in Microsoft Graph Data Connect, not in a loop of API calls.", 12, mono=False, col=INK)
t.text(20, 402, "Limits are from Microsoft Learn (throttling-limits, Nov 2026) and can change; always obey Retry-After.", 11, mono=False, col=MUTED)
t.write("graph-scale-workflow.svg")
print("wrote 4 diagrams to", OUT)
