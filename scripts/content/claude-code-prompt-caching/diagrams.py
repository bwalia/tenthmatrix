#!/usr/bin/env python3
"""Draw the prompt-caching technical-note diagrams (our own drawings).

Run from the repo root: python3 scripts/content/claude-code-prompt-caching/diagrams.py
Writes public/img/claude-code-prompt-caching/*.svg
"""
from pathlib import Path
from xml.sax.saxutils import escape as e

OUT = Path(__file__).resolve().parents[3] / "public/img/claude-code-prompt-caching"
SANS = "Poppins, system-ui, -apple-system, 'Segoe UI', sans-serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, monospace"
INK, MUTED, LINE = "#0d1d21", "#5b6d72", "#44565b"
C = {
    "": ("#ffffff", "#d3dedb"),
    "grey": ("#eef2f1", "#8a9a9e"),
    "read": ("#ddf1ec", "#00806b"),
    "write": ("#fcefd9", "#a85f00"),
    "tools": ("#ece9fb", "#5847c2"),
    "bad": ("#fde7e7", "#c2373a"),
}
GREEN, AMBER, PURPLE, RED = "#00806b", "#a85f00", "#5847c2", "#c2373a"


class Svg:
    def __init__(self, w, h, title):
        self.w, self.h, self.title, self.parts = w, h, title, []

    def add(self, s):
        self.parts.append(s)

    def rect(self, x, y, w, h, v="", rx=6, sw=1.3):
        f, s = C[v]
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{f}" stroke="{s}" stroke-width="{sw}"/>')

    def text(self, x, y, t, size=12, anchor="start", mono=False, col=MUTED, weight="400"):
        self.add(f'<text x="{x}" y="{y}" text-anchor="{anchor}" fill="{col}" font-family="{MONO if mono else SANS}" font-size="{size}" font-weight="{weight}">{e(t)}</text>')

    def line(self, x1, y1, x2, y2, col=LINE, w=1.4, dash=False):
        d = ' stroke-dasharray="5 4"' if dash else ""
        self.add(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{col}" stroke-width="{w}"{d}/>')

    def flag(self, x, y, col=PURPLE):
        """A cache breakpoint marker: a small flag on a pole."""
        self.line(x, y, x, y + 46, col, 1.6)
        self.add(f'<path d="M{x},{y} L{x + 13},{y + 5} L{x},{y + 10} z" fill="{col}"/>')

    def write(self, name):
        svg = (
            f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" width="{self.w}" height="{self.h}" role="img">'
            f'<title>{e(self.title)}</title><rect width="{self.w}" height="{self.h}" fill="#ffffff"/>' + "".join(self.parts) + "</svg>\n"
        )
        (OUT / name).write_text(svg, encoding="utf-8")


OUT.mkdir(parents=True, exist_ok=True)

# 1. The prefix, turn by turn ------------------------------------------------
s = Svg(1200, 600, "How prompt caching works turn by turn: each request renders tools, then system, then messages. The unchanged prefix is read from cache at a tenth of the input price or less, only the new turn is written, and a change near the start (a model switch or a new tool) rewrites everything after it")
s.text(30, 38, "One conversation, four requests", 17, col=INK, weight="600")
s.text(30, 60, "Every request re-sends the whole prompt. The API matches its start (the prefix) against what it processed recently.", 12.5)
X0, U = 190, 27  # left edge of bars, px per unit
rows = [
    ("Request 1", [("tools", 3, "write"), ("system", 4, "write"), ("turn 1", 4, "write")], "first time: everything is written"),
    ("Request 2", [("tools", 3, "read"), ("system", 4, "read"), ("turn 1", 4, "read"), ("turn 2", 4, "write")], "only turn 2 is new"),
    ("Request 3", [("tools", 3, "read"), ("system", 4, "read"), ("turn 1", 4, "read"), ("turn 2", 4, "read"), ("turn 3", 4, "write")], "the cached part keeps growing"),
    ("Request 4", [("tools*", 3, "bad"), ("system", 4, "write"), ("turn 1", 4, "write"), ("turn 2", 4, "write"), ("turn 3", 4, "write"), ("turn 4", 3, "write")], "a tool was added: the whole prefix is rewritten"),
]
for i, (label, segs, note) in enumerate(rows):
    y = 92 + i * 92
    s.text(30, y + 30, label, 14, col=INK, weight="600")
    x = X0
    for name, n, v in segs:
        w = n * U
        s.rect(x, y + 8, w - 3, 38, v, rx=5)
        s.text(x + (w - 3) / 2, y + 32, name, 12, "middle", mono=True, col=INK)
        x += w
    s.flag(x - 3, y - 4)
    s.text(x + 18, y + 32, note, 12)
# legend
ly = 470
for i, (v, t) in enumerate([("read", "read from cache · 0.1× input price (0.05× on Opus 5.5 and Sonnet 5.5)"),
                            ("write", "written to cache · 1.25× (5-minute) or 2× (1-hour)"),
                            ("bad", "changed near the start · everything after it misses")]):
    yy = ly + i * 30
    s.rect(30, yy, 30, 20, v, rx=4)
    s.text(72, yy + 15, t, 12.5)
s.flag(760, ly - 4)
s.text(784, ly + 15, "cache breakpoint (cache_control)", 12.5, col=INK)
s.text(784, ly + 45, "order is always tools → system → messages", 12.5)
s.text(784, ly + 75, "up to 4 breakpoints · 20-position lookback", 12.5)
s.write("prompt-cache-prefix-turns.svg")

# 2. What breaks and keeps the cache in Claude Code ---------------------------
s = Svg(1200, 640, "Claude Code prompt layers and the cache: system prompt and tool definitions first, then project context such as CLAUDE.md and memory, then the conversation. Model switches, effort changes on older models, fast mode toggles, MCP server or plugin changes, denying a whole tool, compaction, many images and upgrades break the cache; editing files or CLAUDE.md, permission mode, output style, skills, /recap, /rewind and subagents keep it")
s.text(30, 38, "Claude Code: what each request contains, and what breaks the cache", 17, col=INK, weight="600")
layers = [
    ("1  System prompt + tool definitions", "changes when the set of loaded tools changes", "tools"),
    ("2  Project context", "CLAUDE.md · auto memory · rules · reloaded after /clear or /compact", "grey"),
    ("3  Conversation", "your messages · Claude's replies · tool results · grows every turn", "read"),
]
for i, (t, l, v) in enumerate(layers):
    y = 64 + i * 66
    s.rect(30, y, 520, 56, v, rx=7)
    s.text(48, y + 24, t, 14, col=INK, weight="600")
    s.text(48, y + 43, l, 11.5)
s.add(f'<path d="M570,64 L590,64 L590,244 L570,244" fill="none" stroke="{LINE}" stroke-width="1.4"/>')
s.text(604, 150, "a change in a layer re-processes", 12.5, col=INK)
s.text(604, 168, "that layer and everything after it", 12.5, col=INK)
# two columns
bad = [
    ("Switching model (/model, opusplan, skill model:)", "each model has its own cache"),
    ("Changing effort (older models)", "kept on Fable 5.1+, Opus 5.5, Sonnet 5.5, Haiku 5.5"),
    ("Turning fast mode on or off", "fast and standard keep separate caches"),
    ("MCP server or plugin change", "only when tools load upfront (no tool search)"),
    ("Denying a whole tool (e.g. Bash)", "only when tool search is off"),
    ("/compact or auto-compaction", "new, shorter history: rebuilt once"),
    ("Many images, upgrading Claude Code", "old images dropped · new system prompt"),
]
good = [
    ("Editing files in the repository", "the copy already read stays as it was"),
    ("Editing CLAUDE.md mid-session", "loaded at start; reload with /clear"),
    ("Permission mode, output style", "system prompt and tools stay the same"),
    ("Skills and slash commands", "appended as user messages"),
    ("/recap and /rewind", "append, or go back to a cached prefix"),
    ("Spawning a subagent", "own cache; the parent's is untouched"),
]
s.text(30, 290, "BREAKS THE CACHE (one slower, dearer turn)", 12.5, col=RED, weight="600")
s.text(620, 290, "KEEPS THE CACHE", 12.5, col=GREEN, weight="600")
for i, (t, l) in enumerate(bad):
    y = 302 + i * 46
    s.rect(30, y, 560, 40, "bad", rx=6, sw=1.1)
    s.text(46, y + 17, t, 12.5, col=INK, weight="600")
    s.text(46, y + 33, l, 11)
for i, (t, l) in enumerate(good):
    y = 302 + i * 46
    s.rect(620, y, 550, 40, "read", rx=6, sw=1.1)
    s.text(636, y + 17, t, 12.5, col=INK, weight="600")
    s.text(636, y + 33, l, 11)
s.text(620, 600, "Pick model and effort at the start · /compact at natural breaks · /clear between tasks", 12, col=INK)
s.write("claude-code-cache-breakers.svg")

# 3. The economics -------------------------------------------------------------
s = Svg(1200, 480, "Cost of ten requests that share a 50,000-token prefix on Claude Opus 5.5: $2.00 without caching, $0.34 with the 5-minute cache and $0.49 with the 1-hour cache; choose the 5-minute TTL when requests are under 5 minutes apart and the 1-hour TTL for gaps of 5 to 60 minutes")
s.text(30, 38, "Ten requests, one 50,000-token shared prefix, Claude Opus 5.5", 17, col=INK, weight="600")
s.text(30, 60, "Input price $4 / MTok · 5-minute write $5 · 1-hour write $8 · cache read $0.20", 12.5)
bars = [
    ("No caching", 2.00, "10 × 50k × $4/M", "grey"),
    ("5-minute cache", 0.34, "1 write $0.25 + 9 reads $0.09", "read"),
    ("1-hour cache", 0.49, "1 write $0.40 + 9 reads $0.09", "write"),
]
BX, SCALE = 200, 300  # px per dollar
for i, (t, v, note, col) in enumerate(bars):
    y = 90 + i * 66
    s.text(30, y + 30, t, 14, col=INK, weight="600")
    s.rect(BX, y + 6, max(v * SCALE, 6), 40, col, rx=5)
    s.text(BX + v * SCALE + 14, y + 26, f"${v:.2f}", 15, col=INK, weight="600")
    s.text(BX + v * SCALE + 14, y + 42, note, 11, mono=True)
s.text(BX, 316, "83% less with the 5-minute cache. Output tokens are billed the same either way.", 12.5, col=GREEN, weight="600")
# TTL guide
s.text(30, 360, "Which TTL? Measure the gap between the starts of requests that share the prefix", 13.5, col=INK, weight="600")
guide = [
    ("under 5 minutes", "5-minute TTL · every request refreshes it for free", "read"),
    ("5 to 60 minutes", "1-hour TTL · the only case where the 2× write pays off", "write"),
    ("over an hour", "neither: pre-warm with max_tokens: 0, or accept one miss", "grey"),
]
for i, (gap, what, v) in enumerate(guide):
    x = 30 + i * 385
    s.rect(x, 376, 370, 72, v, rx=7)
    s.text(x + 16, 402, gap, 14, col=INK, weight="600")
    s.text(x + 16, 426, what, 11.5)
s.write("prompt-cache-cost-ttl.svg")
print("wrote", sorted(p.name for p in OUT.glob("*.svg")))
