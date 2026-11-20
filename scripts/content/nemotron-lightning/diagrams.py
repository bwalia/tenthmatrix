#!/usr/bin/env python3
"""Draw the Nemotron 3.5 Lightning blog + technical-note diagrams (our own drawings).

Run from the repo root: python3 scripts/content/nemotron-lightning/diagrams.py
Writes public/img/nemotron-lightning/*.svg
"""
from pathlib import Path
from xml.sax.saxutils import escape as e

OUT = Path(__file__).resolve().parents[3] / "public/img/nemotron-lightning"
SANS = "Poppins, system-ui, -apple-system, 'Segoe UI', sans-serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, monospace"
INK, MUTED, LINE = "#0d1d21", "#5b6d72", "#44565b"
C = {
    "": ("#ffffff", "#d3dedb"),
    "grey": ("#eef2f1", "#8a9a9e"),
    "green": ("#ddf1ec", "#00806b"),
    "amber": ("#fcefd9", "#a85f00"),
    "purple": ("#ece9fb", "#5847c2"),
    "red": ("#fde7e7", "#c2373a"),
    "dark": ("#0d1d21", "#0d1d21"),
}
GREEN, AMBER, PURPLE, RED = "#00806b", "#a85f00", "#5847c2", "#c2373a"


class Svg:
    def __init__(self, w, h, title, bg="#ffffff"):
        self.w, self.h, self.title, self.bg, self.parts = w, h, title, bg, []

    def add(self, s):
        self.parts.append(s)

    def rect(self, x, y, w, h, v="", rx=8, sw=1.3):
        f, s = C[v]
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{f}" stroke="{s}" stroke-width="{sw}"/>')

    def text(self, x, y, t, size=13, anchor="start", mono=False, col=MUTED, weight="400"):
        self.add(
            f'<text x="{x}" y="{y}" text-anchor="{anchor}" fill="{col}" font-family="{MONO if mono else SANS}" '
            f'font-size="{size}" font-weight="{weight}">{e(t)}</text>'
        )

    def arrow(self, x1, y1, x2, y2, col=LINE, w=1.6, dash=False):
        d = ' stroke-dasharray="6 5"' if dash else ""
        self.add(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{col}" stroke-width="{w}"{d} marker-end="url(#ah)"/>')

    def write(self, name):
        defs = (
            '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M0,0 L10,5 L0,10 z" fill="{LINE}"/></marker></defs>'
        )
        svg = (
            f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" '
            f'width="{self.w}" height="{self.h}" role="img"><title>{e(self.title)}</title>{defs}'
            f'<rect width="{self.w}" height="{self.h}" fill="{self.bg}"/>' + "".join(self.parts) + "</svg>\n"
        )
        (OUT / name).write_text(svg, encoding="utf-8")


OUT.mkdir(parents=True, exist_ok=True)

# 1. Cover: a local agent tier on your own machine, a cloud tier for the few hard steps ------------
s = Svg(1200, 630, "Nemotron 3.5 Lightning on Ollama: an always-on agent runs most steps on a local 30B model with 3B active parameters, and sends the few hard steps to a larger cloud model through the same API", bg="#0d1d21")
s.text(60, 92, "NVIDIA Nemotron 3.5 Lightning on Ollama", 34, col="#ffffff", weight="700")
s.text(60, 132, "Local AI agents that keep running, with your data on your own machine", 19, col="#9fc9bf")
# local box
s.add('<rect x="60" y="190" width="640" height="370" rx="16" fill="#12292e" stroke="#00a88c" stroke-width="2"/>')
s.text(88, 228, "YOUR DEVICE", 13, col="#5fd3bd", weight="600")
s.text(88, 256, "RTX PC · RTX PRO workstation · DGX Spark · Mac (MLX)", 14, col="#b8cfca")
steps = ["read a file", "call a tool", "sort the result", "retry what failed", "query the logs", "summarise"]
for i, t in enumerate(steps):
    x = 88 + (i % 3) * 200
    y = 290 + (i // 3) * 74
    s.add(f'<rect x="{x}" y="{y}" width="180" height="52" rx="10" fill="#1b3a40" stroke="#2f6a70" stroke-width="1.2"/>')
    s.text(x + 90, y + 32, t, 15, anchor="middle", col="#e6f2ef")
s.add('<rect x="88" y="452" width="580" height="80" rx="12" fill="#00806b"/>')
s.text(378, 484, "Nemotron 3.5 Lightning", 20, anchor="middle", col="#ffffff", weight="700")
s.text(378, 512, "30B parameters · 3B active per token · 1M-token context", 15, anchor="middle", col="#dff5ef")
# cloud box
s.add('<rect x="820" y="250" width="320" height="200" rx="16" fill="#1d1a3a" stroke="#8b7cf0" stroke-width="2" stroke-dasharray="7 6"/>')
s.text(980, 290, "CLOUD (OPTIONAL)", 13, anchor="middle", col="#b6acf7", weight="600")
s.text(980, 340, "A larger model", 20, anchor="middle", col="#ffffff", weight="600")
s.text(980, 370, "for the few steps", 15, anchor="middle", col="#d4cff8")
s.text(980, 392, "that need one", 15, anchor="middle", col="#d4cff8")
s.text(980, 426, "same CLI · same API", 13, anchor="middle", col="#b6acf7", mono=True)
s.add('<line x1="704" y1="350" x2="812" y2="350" stroke="#8b7cf0" stroke-width="2" stroke-dasharray="6 5"/>')
s.add('<path d="M812,343 L824,350 L812,357 z" fill="#8b7cf0"/>')
s.text(758, 338, "hard step", 12, anchor="middle", col="#b6acf7")
s.text(60, 602, "tenthmatrix.com", 14, col="#7fa59d")
s.text(1140, 602, "Most steps stay local. Data stays local.", 14, anchor="end", col="#7fa59d")
s.write("nemotron-lightning-cover.svg")

# 2. Mixture of experts: 30B on disk, 3B doing the work for each token ---------------------------
s = Svg(1200, 520, "Mixture of experts: the model stores 30 billion parameters, but a router picks a few experts for each token, so only about 3 billion parameters are computed per token. Memory is sized by the 30B; speed is closer to a 3B model")
s.text(40, 46, "Why 30B parameters run like a small model", 20, col=INK, weight="600")
s.text(40, 74, "Memory holds every expert. Each token only wakes a few of them.", 14)
s.rect(40, 110, 150, 70, "grey")
s.text(115, 141, "token", 15, anchor="middle", col=INK, weight="600")
s.text(115, 162, "“retry the test”", 12, anchor="middle", mono=True)
s.arrow(190, 145, 250, 145)
s.rect(252, 110, 150, 70, "purple")
s.text(327, 141, "router", 15, anchor="middle", col=INK, weight="600")
s.text(327, 162, "picks experts", 12, anchor="middle")
active = {2, 7, 11}
# Routing lines go under the expert boxes, so the boxes hide them where they cross.
s.add(f'<path d="M402,145 C430,145 430,250 450,250 L1109,250" fill="none" stroke="{GREEN}" stroke-width="1.3" opacity="0.6"/>')
for i in active:
    x = 470 + (i % 8) * 86 + 37
    y = 96 + (i // 8) * 70
    s.add(f'<line x1="{x}" y1="250" x2="{x}" y2="{y + 52}" stroke="{GREEN}" stroke-width="1.3" opacity="0.6"/>')
for i in range(16):
    x = 470 + (i % 8) * 86
    y = 96 + (i // 8) * 70
    v = "green" if i in active else ""
    s.rect(x, y, 74, 52, v)
    s.text(x + 37, y + 31, f"E{i + 1}", 13, anchor="middle", col=INK if i in active else "#9aaaae", weight="600" if i in active else "400")
s.text(470, 284, "Hybrid layers: Mamba-2 (long context, small state) + MoE + a few attention layers", 13, col=INK)
# bars
s.text(40, 330, "What you size the hardware for", 15, col=INK, weight="600")
s.rect(40, 346, 1000, 34, "grey", rx=6)
s.text(52, 369, "Weights in memory: all 30B parameters (19 GB to 66 GB on disk, depending on quantisation)", 13, col=INK)
s.text(40, 420, "What each token costs to compute", 15, col=INK, weight="600")
s.rect(40, 436, 100, 34, "green", rx=6)
s.text(152, 459, "about 3B active parameters, plus multi-token prediction for speculative decoding", 13, col=INK)
s.text(40, 500, "Experts and routing shown schematically; the real model has many more experts per layer.", 12)
s.write("nemotron-moe-active.svg")

# 3. Local-first routing: the agent harness picks the tier per step ------------------------------
s = Svg(1200, 560, "Local-first routing: the agent harness sends each step to Nemotron 3.5 Lightning on the local Ollama server; steps that fail validation, need deep planning or exceed a budget escalate to a larger cloud model through the same Ollama API")
s.text(40, 46, "A local tier alongside the cloud", 20, col=INK, weight="600")
s.text(40, 74, "One harness, one API. The router decides per step, not per project.", 14)
s.rect(40, 110, 240, 120, "grey")
s.text(160, 148, "Agent harness", 16, anchor="middle", col=INK, weight="600")
s.text(160, 174, "Claude Code · OpenCode", 12, anchor="middle")
s.text(160, 194, "Hermes · OpenClaw", 12, anchor="middle")
s.text(160, 214, "or your own loop", 12, anchor="middle")
s.arrow(280, 170, 360, 170)
s.rect(362, 110, 250, 120, "purple")
s.text(487, 148, "Step router", 16, anchor="middle", col=INK, weight="600")
s.text(487, 174, "default: local", 12, anchor="middle")
s.text(487, 194, "escalate on: bad JSON, retries,", 12, anchor="middle")
s.text(487, 214, "planning, policy", 12, anchor="middle")
s.arrow(612, 150, 720, 120)
s.arrow(612, 200, 720, 300, dash=True)
s.rect(722, 70, 440, 130, "green")
s.text(742, 104, "Local Ollama  ·  localhost:11434", 15, col=INK, weight="600")
s.text(742, 130, "nemotron-3.5-lightning", 13, mono=True, col=GREEN)
s.text(742, 156, "Most steps: tool calls, extraction, triage,", 12)
s.text(742, 176, "tests, log queries. Data never leaves the device.", 12)
s.rect(722, 240, 440, 130, "amber")
s.text(742, 274, "Cloud model (same API, :cloud tag or hosted API)", 15, col=INK, weight="600")
s.text(742, 300, "the few steps that need a larger model", 13, col=AMBER)
s.text(742, 326, "Send only what the step needs: redact or", 12)
s.text(742, 346, "summarise first, log what was sent and why.", 12)
s.rect(40, 410, 1122, 128, "")
s.text(60, 442, "Rules of thumb", 15, col=INK, weight="600")
s.text(60, 470, "1. Validate every local answer (schema, tests, exit codes) before trusting it; escalate on failure, not on a hunch.", 13, col=INK)
s.text(60, 494, "2. Keep sensitive inputs on the local tier by policy, not by habit.", 13, col=INK)
s.text(60, 518, "3. Measure the escalation rate. If it climbs for one kind of task, post-train a specialist for that task.", 13, col=INK)
s.write("nemotron-local-cloud-routing.svg")

print("wrote", sorted(p.name for p in OUT.glob("*.svg")))
