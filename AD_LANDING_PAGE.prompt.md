# Prompt: TenthMatrix ad landing page with a project estimator

Based on the "Tenth Matrix – Landing Page Brief" (25 Nov 2026). Paste
everything below the line into Claude (claude.ai or Claude Code). Claude asks
up to five questions about the open items, then builds a working page with a
functioning estimator.

Items marked **[VERIFY]** are claims taken from the current site. They must be
checked before they appear in a paid ad. UK advertising rules (ASA/CAP) require
claims to be substantiated, and named clients need written permission.

---

## 1. About TenthMatrix

TenthMatrix builds custom AI agents, automations and apps for businesses. It is
led by Bal, who has 25+ years in software and has spent the last year or two
building AI apps and automations.

- **Current site:** www.tenthmatrix.com (tenthmatrix.co.uk is an alias).
  Headline: "AI agents that make your team 10x faster."
- **What the agents do:**
  - Sales: lead qualification, account research, CRM updates.
  - Marketing: content drafts, campaign reporting.
  - Back office: invoices, orders, inboxes, tickets, reports.
- **Ways to work together:** fixed-scope projects, dedicated agent teams,
  embedded engineers, build-operate-transfer.
- **Process:** discovery → pilot → build → run or hand over. Discovery ends with
  a written scope and a fixed quote for the pilot.
- **Company:** TenthMatrix is a brand of Workstation Solutions Ltd, registered in
  England and Wales.
- **Tone:** direct, confident and plain-spoken. Focus on measurable outcomes,
  and on humans approving what agents do.

The main site is broad: products, services, docs and 13 languages. This page is
deliberately narrow, with **one offer and one action**.

## 2. What the page is for

The page is the destination for paid ads. It turns a cold click into a **booked
discovery call**, with an estimate step in the middle that qualifies and warms
the visitor.

- **Traffic:** a Meta (Instagram and Facebook) video ad first, Google Ads later.
- **Meta visitors** are interrupted mid-scroll, mostly on a phone. The first
  screen must repeat the ad's promise and explain the offer in seconds.
- **Google visitors (later)** arrive searching with intent. The headline must be
  swappable per campaign from a URL parameter (e.g. `?h=cost` or
  `?h=automation`). It is a single page with headline variants, not separate
  pages.
- **Not a second homepage:** no main navigation, no product catalogue, no blog.
  The header has the logo and one button.
- **One goal:** every section leads back to the estimator or to booking a call.

## 3. Who we are targeting

These are working assumptions for Bal to confirm.

| | Description |
|---|---|
| **Company** | £1M+ annual revenue; UK-based unless Bal says otherwise |
| **Buyer** | Owner, MD or founder; or an operations, sales, marketing or finance lead who owns the problem and can sign off or influence the decision |
| **Pains** | Staff time lost to inboxes, invoicing, order handling, reporting and CRM updates; tools that don't talk to each other; unsure what AI can do or cost; wary of vague, expensive agency projects |
| **Awareness** | Knows the problem, but not sure what an "agent" is. Use plain language and concrete examples |
| **Poor fit** | Businesses well under £1M, or anyone expecting a low-cost off-the-shelf chatbot |

Larger businesses are a later upsell, once there is traction.

## 4. Desired outcomes and events

The **primary outcome is a booked discovery call** from a qualified visitor. A
lead who finishes the estimator but doesn't book is still a win and gets a
follow-up within one working day.

| Step | Event | Why it matters |
|---|---|---|
| Page view | `PageView` | Baseline for click-to-page drop-off |
| Engagement | `estimator_start` | Shows the hook works |
| Qualification | `estimator_complete` (with the revenue band and range band) | Shows intent and gives a revenue band |
| Lead | `Lead` (contact details submitted) | A lead we can follow up even without a booking |
| **Primary goal** | `Schedule` (call booked) | **The conversion to optimise ads for** |
| Quality | Call attended, proposal sent (recorded in the CRM, not on the page) | Judges lead quality beyond cost per lead |

Success is measured in **cost per booked call** and **show-up rate**. Targets:
Bal to set (cost per booked call £___, show-up rate ___%).

## 5. Page structure (mobile-first, in this order)

1. **Minimal header:** logo and a "Book a call" button. No main navigation.
2. **Hero:**
   - An outcome-led headline that repeats the ad's promise, and a one-line
     subhead saying who it is for.
   - A primary button, "Get your free estimate", that scrolls to the estimator,
     plus a text link to book a call.
   - Under the buttons: "Free discovery call. Written scope and fixed quote
     after."
   - Beside or below: Bal's photo, or a 30–60 second video with a poster image
     and no autoplay.
3. **Credibility strip:** 25+ years in software, plus client logos only where
   permission is confirmed.
4. **What we build:** three cards (sales, marketing and back-office agents), each
   with one concrete example from §1.
5. **Estimator:** see §6.
6. **Proof:** see §7.
7. **How it works:** four steps (discovery, pilot, build, run or hand over) with
   rough timings **[Bal to supply]**, and the promise of a written scope and
   fixed quote for the pilot.
8. **Meet Bal:** a photo and two or three sentences on why he builds this.
9. **FAQ:** six to eight questions covering price, timeline, data security, who
   owns the code, what happens if it doesn't work, whether humans stay in
   control, and what systems it connects to.
10. **Final call to action:** repeat the estimator button and the booking option.
11. **Footer:** "TenthMatrix is a brand of Workstation Solutions Ltd, registered
    in England and Wales", plus privacy, cookie and terms links only. Point them
    at the main site's `/en/privacy-policy`, `/en/cookie-policy` and
    `/en/terms-of-service`.

**Sitewide components:**
- a sticky "Get your estimate" bar on mobile;
- a cookie consent banner;
- an embedded booking calendar;
- a thank-you state after booking, which fires `Schedule`.

## 6. Estimator

A short, shop-style configurator. It uses big tappable cards, asks one question
per screen, shows a progress indicator and needs no typing until the end. It
returns an **approximate range, never a fixed price**.

| Step | Question | Options |
|---|---|---|
| 1 | What do you want to build? | AI agent · Workflow automation · Custom app · System integrations · Not sure (multi-select) |
| 2 | What is it for? | Sales and leads · Marketing · Customer support · Finance and admin · Operations · Reporting · Other |
| 3 | How complex is it? | Systems to connect (1 / 2–3 / 4+) · Data sensitivity (standard / regulated) · Team size using it |
| 4 | How soon? | Within a month · 1–3 months · Exploring |
| 5 | Business size | Revenue band: under £1M · £1M–£5M · £5M–£20M · £20M+ |
| Result | Estimate screen | Range, timeline and what's included, then contact details and booking |

**Range logic:**
- Keep **all prices in one config object at the top of the code**, so Bal can
  edit them without touching the interface.
- Each service has a low and a high base price, and each complexity answer
  applies a multiplier.
- Include a minimum-engagement floor and round the results to sensible figures
  (e.g. the nearest £500).
- Show a one-off build range, plus an optional monthly support line if Bal
  decides to offer one.
- Use obvious placeholders (`£___`, or values flagged `PLACEHOLDER`) until Bal
  supplies real numbers.

**Result screen:**
- Summarise their choices, show the range and a rough timeline, and state that
  the final fixed quote comes after discovery.
- Ask for **name, work email and phone only here, after the range is shown**.
- Then offer the embedded calendar, pre-filled with their name and email, with
  the estimate summary passed into the booking notes.
- Secondary option: "Email me this estimate."

**Behind the scenes:**
- Send every submission, with all answers and the ad source (UTM parameters,
  `fbclid`, `gclid`, landing URL, headline variant), to Bal's email and to a
  CRM or sheet.
- Send the visitor a confirmation email.
- If the revenue band is under £1M, still show the estimate, but change the main
  button to a softer "Talk to us" **[Bal to confirm]**.

## 7. Proof

A button to a completed-projects page works as a supporting link, but it
shouldn't carry the proof alone. It sends cold visitors to a page with full site
navigation, and the existing Customer stories page lists 15 stories, mostly
catalogue publishing and DevOps work rather than AI agents. **Put the strongest
proof on the page itself** and link out for the rest.

| Proof element | What it is | Source / status |
|---|---|---|
| **Featured case study** | One card for the Workstation AI shop, where an AI sales agent gathers buyer needs and builds the basket. Links to the full case study. Says it is a **sister company** | Stories and About us pages: "£100m worth of sales enquiries, worth £2m in referral commission" within a couple of months of launch **[VERIFY]** |
| **Result tiles** | Three metric tiles: Elsevier (80% faster publishing), OyezStraker (a 150-page catalogue in about a week instead of 3–4 weeks manually), iModerni (90% time savings) | Stories page **[VERIFY]**. These are automation and publishing results, not AI-agent results, so label them that way |
| **Client quotes** | Two or three short quotes with name and role, e.g. Neil Somerfield, Owner, iModerni LLC | Stories page **[VERIFY permission]**. The Elsevier quote is attributed to "Dr. Sarah Mitchell, CTO, Elsevier": **confirm this person and quote are real before any use** |
| **Founder proof** | Bal's 25+ years, a photo, and a short video saying who he is and how he works | New asset to record |
| **Live demo** | A 30–60 second screen recording of an agent doing a real task. The estimator itself also counts: "this was built by us" | New asset to record |
| **Risk reversal** | Free discovery call, written scope and fixed quote for the pilot, human approval on agent actions, a proposal within 48 hours of the call | Booking page says "proposal within 48 hours" **[VERIFY]**. The site promises a reply within one working day |
| **Link out** | A "See all customer stories" text link under the proof section, opening in a new tab | www.tenthmatrix.com/en/stories |

Recommended order: the featured case study, three result tiles, Bal's video, the
risk-reversal strip, then the link to all stories.

**Cautions before spending on ads:**
- Every figure above is published by TenthMatrix itself and hasn't been
  independently checked. Confirm that each one is accurate and can be backed up.
- Get client permission before using names, logos or quotes in paid ads.
- Leave out the larger claims (e.g. the Barclays savings figure) unless they can
  be confirmed and approved.
- The "10x" promise needs a stated basis. The site says it is measured per
  business, so either say that on the page or soften the headline.

## 8. Tone, design and copy

- **Voice:** direct, confident and plain-spoken, matching the main site. Short
  sentences, outcomes over features, little jargon, British English. Stress
  that humans approve what agents do and that pricing is transparent.
- **Headline directions** (for Claude to refine; not final):
  - "What would an AI agent cost your business? Find out in two minutes."
  - "Stop doing by hand what an AI agent can do for you."
- **Design:**
  - A dark theme to match the main site (background around `#0e1113`). Bal
    supplies the logo, palette and fonts; until then, use the main site's dark
    theme as the reference.
  - One primary button style and a real photo of Bal.
  - No glowing brains or robot stock imagery.
- **Layout:** mobile-first, large tap targets, one clear action per screen.
- **Performance:** fast on a mobile connection. No heavy video autoplay; use a
  poster image, and lazy-load the video and the booking widget.
- **Accessibility:**
  - Good contrast and labelled form fields.
  - The estimator works with the keyboard alone: focus moves to each new
    question, and screen readers announce the progress.
  - `prefers-reduced-motion` is respected.
- **Copy rules:** no invented numbers, clients, testimonials or prices. Every
  claim must come from §7 or be marked [VERIFY].

## 9. Tracking and technical requirements

- **Build:** one page that can be deployed on its own subdomain (e.g.
  `go.tenthmatrix.com` or `go.tenthmatrix.co.uk`), separate from the main site so
  it can change fast. Set it to `noindex` unless Bal wants it to rank.
- **Tracking hooks** (stubs with placeholder IDs for now): Meta Pixel and the
  Conversions API, and the Google tag. Events: `PageView`, `estimator_start`,
  `estimator_complete`, `Lead`, `Schedule`. Give the browser events an event ID,
  so the Conversions API can de-duplicate them later.
- **Ad source capture:** store UTM parameters, `fbclid` and `gclid` with every
  lead. Keep them for the session, in case the visitor scrolls and books later.
- **Consent:** a cookie banner that blocks the Meta and Google tags until the
  visitor accepts, with links to the privacy and cookie policies.
- **Forms:** spam protection (honeypot and CAPTCHA), client-side validation, and
  **server-side validation at the receiving endpoint**. Submissions go to email
  and to a CRM or sheet.
- **Booking:** an embedded calendar (Cal.com or Calendly) with screening
  questions, not a link to the generic contact page. Pass through the name, the
  email and the estimate summary.
- **Conversion confirmation:** a thank-you state or page after booking, which
  fires `Schedule` when the booking tool reports a completed booking. Clicking
  the calendar doesn't count.

### If you build this inside the tenthmatrix repository (Claude Code)

- **Where it lives:** put the page in its own folder, e.g. `landing/go/index.html`,
  outside the Next.js app, and keep it out of the website build and CI. Publish
  it the way the product sites are published: a static folder served through the
  edge with its own vhost and DNS record (see CLAUDE.md, "Product websites").
- **Leads:** post to OpsAPI's existing public leads endpoint
  (`POST https://api.tenthmatrix.com/api/v2/public/leads/tenthmatrix`), as the
  site's contact form does. It already validates on the server. Confirm with the
  owner that OpsAPI's CORS allow-list includes the landing subdomain, and how it
  notifies Bal by email.
- **Conversions API:** needs a server-side call. Propose the smallest option, for
  example a small endpoint on the existing k3s API reached through an edge rule,
  like `/api/chat`. Don't build it without asking.
- **Never push, deploy, create DNS records or edge rules, or launch ads without
  the owner's explicit go-ahead.**

## 10. Open items for Bal

Claude should ask about these before building, or use clearly marked
placeholders.

- ☐ What the page leads with: agents, automations or custom apps
- ☐ Price ranges per service and complexity level, and the minimum engagement
- ☐ One-off build price, monthly support, or both
- ☐ Booking tool and call length. The site currently mentions a free 30-minute
  discovery call, and 15 minutes for visitors unsure what they need
- ☐ Logo, colours and fonts, plus a photo and short video of Bal
- ☐ Which client stories and quotes can be used in paid ads, with written
  permission for each
- ☐ Confirmation that each figure in §7 is accurate, including whether the
  Elsevier quote and attribution are real
- ☐ What happens to visitors under £1M revenue
- ☐ Country or region to target
- ☐ Subdomain (.com or .co.uk) and hosting
- ☐ Where leads go: email address, CRM or sheet
- ☐ The response promise to state on the page (the site says an engineer replies
  within one working day)
- ☐ Rough timings for each "How it works" step
- ☐ Meta Pixel ID and Google tag ID, when ready
- ☐ Targets for cost per booked call and show-up rate

## 11. Starter prompt

You are a senior conversion-focused web designer and front-end developer. Using
the brief above, build a single-page, mobile-first landing page for TenthMatrix
as **one self-contained HTML file** (inline CSS and JavaScript, no build step,
no external frameworks).

First, ask me **up to five questions** about anything in §10 that you can't
reasonably assume. Then build:

1. Every section in §5, in that order, including the sticky mobile bar, the
   cookie banner, the calendar embed and the thank-you state.
2. A working multi-step estimator as specified in §6. Put all prices and
   multipliers in **one config object at the top of the file**, using
   placeholder values, so I can edit them. Show the result as a range, then
   the contact form, then the calendar embed placeholder. Include the
   under-£1M behaviour and the "Email me this estimate" option.
3. The proof section as specified in §7. Use only the figures, quotes and links
   in the brief, and keep the [VERIFY] flags visible in code comments.
4. Tracking stubs for the events in §4, with placeholder IDs and event IDs, and
   a cookie consent banner that blocks them until accepted. Capture UTM
   parameters, `fbclid` and `gclid` and send them with the lead.
5. Headline variants switchable by URL parameter, as described in §2.

Don't invent clients, numbers, testimonials or prices; use obvious placeholders
instead. Match the tone and design guidance in §8.

When you're done, give me a short list of everything I need to replace or
confirm before the page goes live.
