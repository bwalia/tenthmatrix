# TenthMatrix brand

Status: v1, direction **B "Lattice"** chosen. Canonical tokens live in
`design/tm-theme.css`; logo files in `public/brand/`; React versions in
`src/app/brand-assets/`. The generator and preview scripts that produced the
SVGs are kept in `brand/source/` so the geometry can be rebuilt exactly.

Preview sheet: `brand/preview.png`.

---

## 1. Positioning

**Line:** *Software that puts AI agents to work.*

Alternatives considered: "AI agents, built to ship." / "The step after the
demo." We keep the first: it says what we do, and "to work" covers both meanings
(agents that function, agents doing real jobs).

**What TenthMatrix is.** A software company that designs, builds and runs AI
agents, AI tools and applications, and the products around them (Ring Promoter,
WSL Proxy, WSL Vault, Jobshout, Jev, the Nebula family). It also publishes the
technical writing behind that work. Hardware lives at Workstation; TenthMatrix
is the software half and looks like a separate company.

**The idea in the name.** A matrix is the maths underneath every model: rows,
columns, weights. *Tenth* is one step past the complete set. Nine cells make a
finished grid; the tenth is the one that leaves it and does something. That is
the brand in one picture: the model is the grid, the agent is the tenth cell.

## 2. Audience

| Who | What they need from us | What puts them off |
|---|---|---|
| Engineering leaders (Head of Eng, CTO, platform leads) | Architecture, trade-offs, cost, how it runs in production | Vague claims, no diagrams, no code |
| Founders and product leads | What it does, how fast, what it costs, who has done it | Jargon walls, "contact sales" with no detail |
| Ops, SRE and security teams | Deployment model, observability, data handling, failure modes | Anything that hides how it breaks |

They read on a laptop between meetings and on a phone in a queue. They skim
headings and code blocks first. They trust specifics and distrust adjectives.

## 3. Voice

Direct, technical, calm. British English (organise, behaviour, licence as a
noun, colour, programme for schedules, program for software).

- Lead with the outcome, then the mechanism, then the proof.
- Use numbers, names and versions. "Cuts triage from 40 minutes to 6" beats "dramatically faster".
- Short sentences. One idea each. Active voice.
- Say what it does not do. Limits build trust.
- No hype words: *revolutionary, game-changing, seamless, unlock, unleash,
  supercharge, cutting-edge, next-gen, world-class, effortless, magic, synergy,
  leverage (as a verb), empower, robust (as filler), best-in-class.*
- No exclamation marks in product copy. No emoji in UI or headings.
- Sentence case for headings and buttons.

### Copy examples

| Bad | Good |
|---|---|
| Unlock the power of AI with our revolutionary agent platform! | Agents that read your tickets, draft the fix and open the pull request. You review and merge. |
| Seamless integration with all your tools. | Connects to GitHub, Jira, Slack and Postgres. Anything else, through an MCP server you control. |
| Game-changing security for the AI era. | WSL Vault keeps model API keys out of your code. Keys are issued per agent, scoped per task and revoked on exit. |
| Get started today! | Start a pilot |
| Our cutting-edge team leverages best-in-class tooling. | Six engineers, all of whom have run agents in production. |
| Learn more | Read the architecture |
| Oops! Something went wrong. | That page didn't load. Try again, or go back to the articles. |

---

## 4. Three directions

### A. "Tensor" — editorial ink and ultramarine

- **Logo idea.** A 10-unit square drawn as three stacked, offset planes (a tensor seen in isometric), the top plane cut to suggest a "1" and "0". 
- **Palette.** Off-white `#FAFAF7`, ink `#111318`, ultramarine `#2B3FD6`, coral highlight `#E2553F`.
- **Type.** Fraunces (display serif) / Inter (body) / Fira Code (mono).
- **Mood.** Academic journal meets research lab. Serif headlines, generous margins, footnotes, diagrams.
- **Rationale.** Positions TenthMatrix as the thinking company: long-form articles get the gravity of a paper. It suits the blog and Jev insights well. It falls down on product pages, where a serif display face reads slow and literary, and the isometric mark loses its planes below 24 px. Ultramarine on paper also sits too close to the generic "AI blue" every competitor uses.

### B. "Lattice" — graphite, warm paper and viridian (CHOSEN)

- **Logo idea.** A 3x3 matrix of cells with a tenth cell stepped out diagonally past the top-right corner, in the accent colour. Nine plus one: the grid is the model, the tenth cell is the agent acting on it. Paired with a constructed monoline geometric wordmark whose *i* dot is the same accent square.
- **Palette.** Warm paper `#F7F6F2`, graphite ink `#12161A`, viridian `#0A7A57` (light) / mint `#3DD69E` (dark), amber `#9A5300` / `#F2B252` as a rare second accent.
- **Type.** Bricolage Grotesque (display) / Instrument Sans (body) / IBM Plex Mono (mono).
- **Mood.** A well-run engineering notebook: calm, precise, a bit warm. Lots of paper, black ink, one green signal.
- **Rationale.** It comes straight from the name and survives every size: the mark is nine squares and one more, so it is crisp at 16 px and still means something at 512 px. Green-on-graphite says "running, healthy, go" to an engineering audience without the purple-and-pink AI cliché, and it has nothing in common with Workstation's pink and navy. Warm paper keeps long articles comfortable; the dark theme is graphite with a green cast, not navy. The type is characterful in headings (Bricolage's ink traps and optical sizes) and quiet in body copy, with a mono that reads as engineering rather than hacker.

### C. "Next dimension" — dark-first, spectral

- **Logo idea.** A "10" where the 0 is a wireframe cube rotated out of the plane, the 1 its shadow edge.
- **Palette.** Near-black `#08090C`, chalk `#EDEDF2`, electric cyan `#3FE0F0`, violet `#8B6CFF` gradient.
- **Type.** Space Grotesk (display) / Manrope (body) / Space Mono (mono).
- **Mood.** Launch-video energy: dark, glowing edges, motion-heavy hero.
- **Rationale.** It looks like an AI company immediately, which is also its problem: cyan-violet gradients and glowing wireframes are what half the sector uses, so it differentiates poorly and dates fast. A wireframe cube is fiddly at 16 px, and dark-first design makes long technical articles harder to read. Kept as a reference for campaign or event art, not the core identity.

**Recommendation: B "Lattice".** It is the only one of the three that is original, legible at favicon size, comfortable for long-form reading and clearly unrelated to Workstation.

---

## 5. Logo system (Lattice)

### 5.1 Construction

**Mark** (`tm-mark.svg`), 32 x 32 unit grid:

```
 col:  0-6   8-14  16-22      26-32
 y 0-6                        [10]   <- tenth cell, accent
 y10-16 [1]   [2]   [3]
 y18-24 [4]   [5]   [6]
 y26-32 [7]   [8]   [9]
```

- Cells 6 units, gaps 2 units, corner radius 1 unit (1/6 of a cell).
- The tenth cell is offset by a 4-unit gap on both axes (twice the internal gap) so it reads as *outside* the grid, not a missing tile.
- All edges sit on even units, so at 16 px (scale 0.5) every cell lands on whole pixels: 3 px cells, 1 px gaps.
- The 16 px favicon (`icon.svg`) is drawn separately on a 16-px grid: graphite tile, 2 px cells, 1 px gaps, tenth cell 2 px in mint. It is crisp at 16, 32 and 48.

**Wordmark**, constructed, not typeset:

- Cap height 24 units, x-height 17, stroke 4 (1/6 of cap height), butt ends, mitred corners.
- Bowls (e, n, h, a, r) are arcs on one circle (centre-line radius 6.5) so the rhythm is regular.
- *M* has vertical stems and a centre vertex at 13/24 of cap height, trimmed flat at the cap line.
- *t* rises to y=1 (below cap height) with a crossbar at the x-height line.
- *i* dot is a 4 x 4 square in the accent colour, echoing the tenth cell. In mono variants it takes the ink colour.
- "TenthMatrix" is one word, camel-cased. The capital M is the hinge of the name; never write "Tenth Matrix", "TENTHMATRIX" or "Tenthmatrix".

**Horizontal lockup** (`tm-logo.svg`, 236.5 x 32): the mark at full height, a 12-unit gap (two cells), then the wordmark with its baseline on the mark's bottom edge and its cap line on the tenth cell's top edge. **Stacked lockup** (`tm-logo-stacked.svg`, 192.5 x 88): the mark at 1.5x (48 units), centred above the wordmark with a 16-unit gap.

### 5.2 Clear space and minimum sizes

- Clear space on every side = one tenth cell plus one gap (8 units at the 32-unit mark size, i.e. 1/4 of the mark height). Nothing enters that box: no text, no edges, no other logos.
- Minimum sizes: horizontal lockup 20 px tall (≈ 148 px wide) on screen, 6 mm in print. Stacked lockup 64 px tall. Mark alone 16 px (use `icon.svg` below 24 px).

### 5.3 Files

| File | Use |
|---|---|
| `tm-logo.svg` | Primary lockup on light backgrounds |
| `tm-logo-on-dark.svg` | Primary lockup on dark backgrounds (chalk ink, mint accent) |
| `tm-logo-stacked.svg` / `tm-logo-stacked-on-dark.svg` | Square-ish placements: social avatars, footer, title slides |
| `tm-mark.svg` / `tm-mark-on-dark.svg` | Mark alone where the name appears nearby |
| `tm-logo-mono-dark.svg` | One colour, graphite ink, for light backgrounds, print, fax-grade output |
| `tm-logo-mono-light.svg` | One colour, white, for dark or photographic backgrounds |
| `tm-mark-mono.svg` | One colour, `currentColor` (inherits text colour when inlined) |
| `icon.svg`, `favicon.ico` (16/32/48), `icon-192.png`, `icon-512.png`, `apple-icon.png` (180, full-bleed) | Browser, PWA and home-screen icons |
| `og-background.svg` / `.png` | 1200 x 630 background for the `next/og` article template; title text goes in the left 680 px |

In React: `<Logo variant="brand" />` picks up `--tm-logo-ink` / `--tm-logo-accent` and so switches with the theme. `variant="light" | "dark" | "mono"`, `layout="stacked"`, `size` = height in px. Pass `title=""` inside a link that already has an accessible name.

### 5.4 Misuse

Do not:

- recolour the nine grid cells, or put the accent anywhere other than the tenth cell and the *i* dot;
- move, rotate or resize the tenth cell, or add an eleventh;
- set the wordmark in a font, outline it, add a shadow, glow or gradient;
- stretch, skew or rotate the lockup, or change the mark-to-wordmark gap;
- place the colour logo on mid-tone or busy imagery (use a mono variant on a solid panel);
- use the light-background logo on dark surfaces or vice versa;
- animate the grid cells individually in the logo itself (motion belongs to illustrations, see 9).

---

## 6. Colour

Principle: **ink on paper, one signal.** Most of the page is neutral. The accent
is the tenth cell: links, the primary action, the active state, one highlight
per view. Amber is for the occasional "new", data callout or warning-adjacent
highlight, never as a second button colour.

### 6.1 Light theme

| Token | Hex | Role |
|---|---|---|
| `--tm-bg` | `#F7F6F2` | Page background, warm paper |
| `--tm-surface` | `#FFFFFF` | Cards, panels |
| `--tm-raised` | `#FFFFFF` | Menus, popovers (with shadow) |
| `--tm-sunken` | `#EFEDE7` | Wells, inline code, table stripes |
| `--tm-line` | `#E0DDD4` | Hairlines, dividers (decorative) |
| `--tm-line-strong` | `#7D828A` | Input and control borders (3:1+) |
| `--tm-text` | `#12161A` | Body and headings |
| `--tm-text-muted` | `#474D55` | Secondary copy, lead paragraphs |
| `--tm-text-subtle` | `#5F656D` | Meta, captions, placeholders |
| `--tm-accent` | `#0A7A57` | Links, primary buttons, active state |
| `--tm-accent-hover` | `#086448` | Hover / pressed |
| `--tm-accent-contrast` | `#FFFFFF` | Text on accent |
| `--tm-accent-soft` | `#E2F1EA` | Tinted wash, selected rows, tag pills |
| `--tm-secondary` | `#9A5300` | Amber highlight text |
| `--tm-success` / `-soft` | `#1F7A3B` / `#E3F2E6` | |
| `--tm-warn` / `-soft` | `#8A5A00` / `#FBF0D6` | |
| `--tm-danger` / `-soft` | `#B42318` / `#FBE8E5` | |
| `--tm-info` / `-soft` | `#245BB8` / `#E5EDFA` | |
| `--tm-code-bg` / `-text` | `#15191C` / `#E6E8E3` | Code blocks are dark in both themes |

### 6.2 Dark theme

Designed separately: graphite with a faint green cast (not navy, not pure black),
elevation by getting lighter (`sunken` < `bg` < `surface` < `raised`), text
never pure white, and a brighter mint accent because viridian is too dim on
graphite.

| Token | Hex | Role |
|---|---|---|
| `--tm-bg` | `#0E1113` | Page background |
| `--tm-surface` | `#14181B` | Cards |
| `--tm-raised` | `#1B2024` | Menus, popovers |
| `--tm-sunken` | `#090B0D` | Wells, code blocks |
| `--tm-line` | `#262C31` | Hairlines |
| `--tm-line-strong` | `#68717A` | Control borders (3:1+) |
| `--tm-text` | `#E8EAE6` | Body and headings |
| `--tm-text-muted` | `#B0B7B4` | Secondary copy |
| `--tm-text-subtle` | `#8F9895` | Meta |
| `--tm-accent` | `#3DD69E` | Links, primary buttons |
| `--tm-accent-hover` | `#6BE3B6` | Hover |
| `--tm-accent-contrast` | `#05261A` | Text on accent (dark text on mint) |
| `--tm-accent-soft` | `#10281F` | Tinted wash |
| `--tm-secondary` | `#F2B252` | Amber |
| `--tm-success` / `-soft` | `#62D17E` / `#11261A` | |
| `--tm-warn` / `-soft` | `#F5C451` / `#2B2410` | |
| `--tm-danger` / `-soft` | `#FF8E80` / `#2E1715` | |
| `--tm-info` / `-soft` | `#8DB4FF` / `#141E33` | |
| `--tm-code-bg` / `-text` | `#090B0D` / `#E6E8E3` | |

### 6.3 Contrast ratios (WCAG 2.2)

Computed with the WCAG relative-luminance formula (`brand/source/contrast.py`).
Text pairs need 4.5:1 (AA); control borders and focus rings need 3:1
(non-text). Every pair passes.

#### Light theme

| Foreground | Background | Ratio | Pass |
|---|---|---|---|
| `text` #12161A | `bg` #F7F6F2 | 16.81:1 | AAA |
| `text` #12161A | `surface` #FFFFFF | 18.18:1 | AAA |
| `text` #12161A | `sunken` #EFEDE7 | 15.53:1 | AAA |
| `muted` #474D55 | `bg` #F7F6F2 | 7.89:1 | AAA |
| `muted` #474D55 | `surface` #FFFFFF | 8.53:1 | AAA |
| `muted` #474D55 | `sunken` #EFEDE7 | 7.29:1 | AAA |
| `subtle` #5F656D | `bg` #F7F6F2 | 5.44:1 | AA |
| `subtle` #5F656D | `surface` #FFFFFF | 5.88:1 | AA |
| `subtle` #5F656D | `sunken` #EFEDE7 | 5.03:1 | AA |
| `accent` #0A7A57 | `bg` #F7F6F2 | 4.94:1 | AA |
| `accent` #0A7A57 | `surface` #FFFFFF | 5.34:1 | AA |
| `accent` #0A7A57 | `sunken` #EFEDE7 | 4.56:1 | AA |
| `accent-hover` #086448 | `bg` #F7F6F2 | 6.64:1 | AA |
| `accent-hover` #086448 | `surface` #FFFFFF | 7.18:1 | AAA |
| `accent-hover` #086448 | `sunken` #EFEDE7 | 6.13:1 | AA |
| `secondary` #9A5300 | `bg` #F7F6F2 | 5.38:1 | AA |
| `secondary` #9A5300 | `surface` #FFFFFF | 5.82:1 | AA |
| `secondary` #9A5300 | `sunken` #EFEDE7 | 4.97:1 | AA |
| `accent-contrast` #FFFFFF | `accent` #0A7A57 | 5.34:1 | AA |
| `accent-contrast` #FFFFFF | `accent-hover` #086448 | 7.18:1 | AAA |
| `accent` #0A7A57 | `accent-soft` #E2F1EA | 4.58:1 | AA |
| `secondary` #9A5300 | `secondary-soft` #F8ECDB | 4.99:1 | AA |
| `success` #1F7A3B | `success-soft` #E3F2E6 | 4.64:1 | AA |
| `success` #1F7A3B | `bg` #F7F6F2 | 4.97:1 | AA |
| `success` #1F7A3B | `surface` #FFFFFF | 5.38:1 | AA |
| `warn` #8A5A00 | `warn-soft` #FBF0D6 | 5.23:1 | AA |
| `warn` #8A5A00 | `bg` #F7F6F2 | 5.48:1 | AA |
| `warn` #8A5A00 | `surface` #FFFFFF | 5.93:1 | AA |
| `danger` #B42318 | `danger-soft` #FBE8E5 | 5.56:1 | AA |
| `danger` #B42318 | `bg` #F7F6F2 | 6.08:1 | AA |
| `danger` #B42318 | `surface` #FFFFFF | 6.57:1 | AA |
| `info` #245BB8 | `info-soft` #E5EDFA | 5.46:1 | AA |
| `info` #245BB8 | `bg` #F7F6F2 | 5.95:1 | AA |
| `info` #245BB8 | `surface` #FFFFFF | 6.43:1 | AA |
| `text` #12161A | `accent-soft` #E2F1EA | 15.58:1 | AAA |
| `code-text` #E6E8E3 | `code-bg` #15191C | 14.33:1 | AAA |
| `code-comment` #9AA39F | `code-bg` #15191C | 6.83:1 | AA |
| `code-accent` #5FDDAE | `code-bg` #15191C | 10.47:1 | AAA |
| `line-strong` #7D828A | `bg` #F7F6F2 | 3.57:1 | AA (non-text 3:1) |
| `focus` #0A7A57 | `bg` #F7F6F2 | 4.94:1 | AA (non-text 3:1) |
| `line-strong` #7D828A | `surface` #FFFFFF | 3.87:1 | AA (non-text 3:1) |
| `focus` #0A7A57 | `surface` #FFFFFF | 5.34:1 | AA (non-text 3:1) |
| `line-strong` #7D828A | `sunken` #EFEDE7 | 3.30:1 | AA (non-text 3:1) |
| `focus` #0A7A57 | `sunken` #EFEDE7 | 4.56:1 | AA (non-text 3:1) |

#### Dark theme

| Foreground | Background | Ratio | Pass |
|---|---|---|---|
| `text` #E8EAE6 | `bg` #0E1113 | 15.65:1 | AAA |
| `text` #E8EAE6 | `surface` #14181B | 14.74:1 | AAA |
| `text` #E8EAE6 | `raised` #1B2024 | 13.56:1 | AAA |
| `text` #E8EAE6 | `sunken` #090B0D | 16.28:1 | AAA |
| `muted` #B0B7B4 | `bg` #0E1113 | 9.27:1 | AAA |
| `muted` #B0B7B4 | `surface` #14181B | 8.74:1 | AAA |
| `muted` #B0B7B4 | `raised` #1B2024 | 8.04:1 | AAA |
| `muted` #B0B7B4 | `sunken` #090B0D | 9.65:1 | AAA |
| `subtle` #8F9895 | `bg` #0E1113 | 6.40:1 | AA |
| `subtle` #8F9895 | `surface` #14181B | 6.03:1 | AA |
| `subtle` #8F9895 | `raised` #1B2024 | 5.55:1 | AA |
| `subtle` #8F9895 | `sunken` #090B0D | 6.66:1 | AA |
| `accent` #3DD69E | `bg` #0E1113 | 10.21:1 | AAA |
| `accent` #3DD69E | `surface` #14181B | 9.62:1 | AAA |
| `accent` #3DD69E | `raised` #1B2024 | 8.85:1 | AAA |
| `accent` #3DD69E | `sunken` #090B0D | 10.62:1 | AAA |
| `accent-hover` #6BE3B6 | `bg` #0E1113 | 11.99:1 | AAA |
| `accent-hover` #6BE3B6 | `surface` #14181B | 11.30:1 | AAA |
| `accent-hover` #6BE3B6 | `raised` #1B2024 | 10.39:1 | AAA |
| `accent-hover` #6BE3B6 | `sunken` #090B0D | 12.47:1 | AAA |
| `secondary` #F2B252 | `bg` #0E1113 | 10.17:1 | AAA |
| `secondary` #F2B252 | `surface` #14181B | 9.58:1 | AAA |
| `secondary` #F2B252 | `raised` #1B2024 | 8.81:1 | AAA |
| `secondary` #F2B252 | `sunken` #090B0D | 10.57:1 | AAA |
| `accent-contrast` #05261A | `accent` #3DD69E | 8.71:1 | AAA |
| `accent-contrast` #05261A | `accent-hover` #6BE3B6 | 10.23:1 | AAA |
| `accent` #3DD69E | `accent-soft` #10281F | 8.41:1 | AAA |
| `secondary` #F2B252 | `secondary-soft` #2B2213 | 8.40:1 | AAA |
| `success` #62D17E | `success-soft` #11261A | 8.31:1 | AAA |
| `success` #62D17E | `bg` #0E1113 | 9.87:1 | AAA |
| `success` #62D17E | `surface` #14181B | 9.30:1 | AAA |
| `warn` #F5C451 | `warn-soft` #2B2410 | 9.47:1 | AAA |
| `warn` #F5C451 | `bg` #0E1113 | 11.64:1 | AAA |
| `warn` #F5C451 | `surface` #14181B | 10.96:1 | AAA |
| `danger` #FF8E80 | `danger-soft` #2E1715 | 7.55:1 | AAA |
| `danger` #FF8E80 | `bg` #0E1113 | 8.51:1 | AAA |
| `danger` #FF8E80 | `surface` #14181B | 8.02:1 | AAA |
| `info` #8DB4FF | `info-soft` #141E33 | 8.00:1 | AAA |
| `info` #8DB4FF | `bg` #0E1113 | 9.12:1 | AAA |
| `info` #8DB4FF | `surface` #14181B | 8.59:1 | AAA |
| `text` #E8EAE6 | `accent-soft` #10281F | 12.89:1 | AAA |
| `code-text` #E6E8E3 | `code-bg` #090B0D | 15.97:1 | AAA |
| `code-comment` #8F9895 | `code-bg` #090B0D | 6.66:1 | AA |
| `code-accent` #3DD69E | `code-bg` #090B0D | 10.62:1 | AAA |
| `line-strong` #68717A | `bg` #0E1113 | 3.82:1 | AA (non-text 3:1) |
| `focus` #3DD69E | `bg` #0E1113 | 10.21:1 | AAA (non-text 3:1) |
| `line-strong` #68717A | `surface` #14181B | 3.60:1 | AA (non-text 3:1) |
| `focus` #3DD69E | `surface` #14181B | 9.62:1 | AAA (non-text 3:1) |
| `line-strong` #68717A | `raised` #1B2024 | 3.31:1 | AA (non-text 3:1) |
| `focus` #3DD69E | `raised` #1B2024 | 8.85:1 | AAA (non-text 3:1) |
| `line-strong` #68717A | `sunken` #090B0D | 3.97:1 | AA (non-text 3:1) |
| `focus` #3DD69E | `sunken` #090B0D | 10.62:1 | AAA (non-text 3:1) |

Extra pairs: code string `#F2C27A` on code bg 10.75:1 (light) / 11.99:1 (dark);
code number `#9CC0FF` 9.60:1 / 10.70:1; selection text on selection bg 13.54:1
(light) / 7.18:1 (dark); `--tm-text-inverse` on `--tm-inverse` 16.16:1.

Rule of thumb: `--tm-accent` is safe for text on `bg`, `surface` and
`accent-soft` in light, and on every surface in dark. `--tm-text-subtle` also
passes on `--tm-accent-soft` (5.04:1 light, 5.27:1 dark). Accent on accent-soft
in light is the tightest pair (4.58:1); keep it at 15 px or above.

---

## 7. Typography

All three via `next/font/google` with `display: "swap"`, exposed as CSS
variables `--font-tm-display`, `--font-tm-body`, `--font-tm-mono`, consumed by
`--tm-font-display/body/mono` in the theme.

| Role | Family | Weights | Why |
|---|---|---|---|
| Display | **Bricolage Grotesque** (variable, `opsz` axis) | 500–750, use 650 | Grotesque with ink traps and optical sizing: characterful at 60 px, still clean at 24 px. Nothing like Unbounded's wide geometric caps. |
| Body | **Instrument Sans** (variable) | 400, 500, 600 | Neutral, slightly condensed grotesque with open apertures; long articles read easily and UI stays compact. |
| Mono | **IBM Plex Mono** | 400, 500, 600 | Engineered, slightly humanist mono. Reads as "engineering notebook" rather than editor theme. Distinct from JetBrains Mono. |

Suggested next/font call:

```js
import { Bricolage_Grotesque, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-tm-display", display: "swap", axes: ["opsz"] });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-tm-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-tm-mono", display: "swap" });
```

### Scale (fluid, 390 px → 1440 px)

| Token | Size | Use | Family / weight / leading / tracking |
|---|---|---|---|
| `--tm-text-5xl` | 46 → 86 px | Home hero | Display 650, 1.08, -0.025em |
| `--tm-text-4xl` | 40 → 68 px | Page display | Display 650, 1.08, -0.025em |
| `--tm-text-3xl` | 34 → 52 px | h1 | Display 650, 1.08, -0.025em |
| `--tm-text-2xl` | 28 → 39 px | h2 | Display 600, 1.22, -0.015em |
| `--tm-text-xl` | 24 → 30 px | h3 | Display 600, 1.22, -0.015em |
| `--tm-text-lg` | 20 → 24 px | h4, card titles | Body 600, 1.22 |
| `--tm-text-md` | 18 → 20 px | Lead paragraph | Body 400, 1.6 |
| `--tm-text-base` | 16 → 17 px | Body | Body 400, 1.6 (articles 1.72, max 68ch) |
| `--tm-text-sm` | 15 px | UI, meta, buttons | Body 500 |
| `--tm-text-xs` | 13 px | Captions, eyebrows | Mono 500, uppercase, +0.08em |
| `--tm-text-2xs` | 12 px | Badges, legal | Mono 500 |

Eyebrows are mono uppercase in `--tm-text-subtle`, optionally prefixed with a
6 px accent square (the tenth cell) instead of a bullet.

---

## 8. Iconography

- **Set:** `lucide-react` only. No Font Awesome, no mixed sets, no emoji.
- **Stroke:** 1.75 at 20 px and 24 px, 2 at 16 px. Square line caps where the icon allows; default round joins are fine.
- **Sizes:** 16 (inline with `sm` text), 20 (buttons, nav), 24 (feature lists). Feature icons sit in a 40 px `--tm-accent-soft` square with `--tm-radius-sm`, icon in `--tm-accent`.
- **Colour:** inherit `currentColor`. Accent only for the active or primary item.
- **Accessibility:** decorative icons `aria-hidden`; icon-only buttons get an `aria-label` via next-intl and a 44 px hit area.
- Product glyphs (Ring Promoter, WSL Proxy, etc.) are drawn on the same 6-unit-cell lattice when they need a mark, so the family looks related.

## 9. Imagery and illustration

- **Diagrams over stock.** Architecture diagrams, sequence flows and annotated screenshots do the explaining. No stock photos of people pointing at screens, no robots, no glowing brains.
- **Lattice illustrations.** Hero and section art is built from the logo's cell grid: fields of 6-unit cells at low opacity, with a few cells in accent to show data moving, an agent acting, or a step happening. Flat fills, no gradients on cells, no 3D.
- **Screenshots** sit on `--tm-surface` with a 1 px `--tm-line` border and `--tm-radius`, in a browser-chrome frame only when context matters. Crop tightly; annotate with accent squares and mono labels.
- **Photography** (team, events) is natural light, real places, slightly desaturated; never tinted green.
- **OG images:** `og-background.png` with the article title in Bricolage Grotesque 650, white, left-aligned in a 680 px column; category eyebrow in Plex Mono; lockup bottom-left.

## 10. Motion

- **Purpose first.** Motion explains a change of state or draws the eye to one thing. Nothing moves just to look busy.
- **Durations:** 80 ms (press), 140 ms (hover, colour), 220 ms (menus, popovers), 360 ms (panels, page sections), 560 ms (hero reveal, once). Exits are faster than entrances.
- **Easing:** `--tm-ease-out` for entering, `--tm-ease-in` for leaving, `--tm-ease-standard` for moves. No bounce or elastic.
- **Signature move: the step.** Elements arrive with a short translate (8–12 px) plus fade, staggered 40 ms like cells filling a row. Loaders tick through the 3x3 grid with `--tm-ease-step`, the tenth cell lighting last.
- **Reduced motion:** `prefers-reduced-motion: reduce` sets every `--tm-duration-*` to 0 ms; framer-motion components must read `useReducedMotion()` and skip transforms. No auto-playing video or parallax.
- Animate `transform` and `opacity` only.

## 11. Components (summary for builders)

- Primary button: `--tm-accent` fill, `--tm-accent-contrast` text, `--tm-radius-sm`, 44 px min height, hover `--tm-accent-hover`. Secondary: transparent, 1 px `--tm-line-strong`, `--tm-text`. Tertiary: text link with an arrow.
- Cards: `--tm-surface`, 1 px `--tm-line`, `--tm-radius`, `--tm-shadow-sm` in light; in dark, no shadow, rely on `--tm-surface` against `--tm-bg`.
- Focus: `box-shadow: var(--tm-focus-ring)` on `:focus-visible`, never removed.
- Tag pills: `--tm-accent-soft` / `--tm-accent`, `--tm-radius-pill`, mono `xs`.
- Code blocks: `--tm-code-bg`, Plex Mono 14–15 px, `--tm-radius`, copy button top-right.
