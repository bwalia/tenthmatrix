# TenthMatrix components

Brand: "Lattice" (`brand/BRAND.md`). Styling is SCSS modules + `--tm-*` tokens
(`design/tm-theme.css`); no hard-coded colours. Icons: `lucide-react` only,
passed as components (`icon={Bot}`), never as strings.

```js
import { Hero, Section, Button, Card, ProductCard, ArticleCard, CTA, FeatureGrid, Eyebrow, TagPill, Breadcrumbs, Reveal, RevealItem } from '@/app/components';
```

All primitives are server-safe (no hooks) except `Reveal` (client). Every
component also renders a stable global `tm-*` class (`tm-button`, `tm-card`,
`tm-hero` …) for page-level tweaks; prefer props over overrides.

## Page skeleton (marketing routes)

```jsx
<Hero eyebrow="Agents" title="AI agents that finish the job" lede="…"
      actions={[{ label: 'Start a pilot', href: `/${locale}/contact-us` }, { label: 'Read the architecture', href: `/${locale}/articles` }]} art />
<Section id="what" eyebrow="What it does" title="…" lede="…">
  <FeatureGrid items={[{ icon: Bot, title: '…', body: '…' }]} columns={3} />
</Section>
<Section id="products" title="…" tone="sunken">
  <ul className="tm-grid">{products.map((p) => <li key={p.name}><ProductCard {...p} /></li>)}</ul>
</Section>
<CTA title="…" body="…" primary={{ label: 'Start a pilot', href: `/${locale}/contact-us` }} secondary={{ label: '…', href: '…' }} />
```

Rules: exactly one `<h1>` per page (the `Hero` renders it; don't add another).
Section titles are `h2`, cards inside sections `h3`. Use the 16px mobile
gutter that `Section`/`Hero` already apply; don't add horizontal padding.

## Primitives

### `Button`
| prop | type | default | notes |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'tertiary' \| 'night'` | `'primary'` | `night` = mint on dark, for dark bands |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | min 44px hit area at every size |
| `href` | string | – | internal path → `next/link`; `http(s)://`, `mailto:` → `<a rel="noopener">` |
| `icon` | lucide component | – | leading icon |
| `arrow` | `true \| 'external'` | `true` for tertiary | trailing arrow; external links get ↗ |
| `block` | bool | false | full width |
| `...rest` | | | `type`, `onClick`, `aria-*`, `disabled` (button only), `prefetch` |

### `Eyebrow`
`as` (`'p'`), `marker` (accent square, `true`), `tone` (`'subtle' \| 'accent'`), `children`.

### `Card`
`as` (`'div'`), `href` (whole card is one link; no links inside), `tone`
(`'surface' \| 'sunken' \| 'accent' \| 'night'`), `padding` (`'none' \| 'sm' \| 'md' \| 'lg'`), `interactive`.

### `Section`
`id` (anchor; title gets `${id}-title` and labels the section), `eyebrow`,
`title`, `headingLevel` (`'h2'`), `lede`, `actions` (node, right of the header
on wide screens), `tone` (`'default' \| 'sunken' \| 'surface' \| 'night'`), `width`
(`'default' \| 'narrow' \| 'wide'`), `align` (`'start' \| 'center'`), `spacing`
(`'default' \| 'compact' \| 'none'`), `divider`, `children`.

### `Hero`
Renders the page `<h1>`. `variant` (`'page' \| 'home'`), `eyebrow`, `title`,
`lede`, `actions` (`[{ label, href, variant?, arrow? }]` or a node; first is
primary, rest secondary), `meta` (string[] of mono facts), `art` (`true` =
lattice illustration, a node for custom media, `false`), `align`
(`'start' \| 'center'`), `children` (extra content under the lede).

### `CTA`
`eyebrow`, `title`, `body`, `primary` / `secondary` (`{ label, href }`),
`tone` (`'night'` dark in both themes \| `'accent'`), `headingLevel` (`'h2'`), `art`, `id`.

### `ProductCard`
`name`, `tagline`, `description`, `href` (internal or external), `cta` (link
text at the bottom), `icon` (lucide component), `status` (badge text, e.g.
"Open source"), `tags` (string[]), `headingLevel` (`'h3'`), `variant`
(`'default' \| 'feature'` spans 2 columns in `.tm-grid`). Whole card clickable.

### `ArticleCard`
`title`, `href`, `excerpt`, `date` (ISO/Date), `locale`, `image`, `kind`
("Article" / "Blog" / "Insight"), `readingTime` (preformatted string), `tags`
(string[]), `headingLevel` (`'h3'`), `variant` (`'default' \| 'feature' \| 'compact'`), `badge`.

### `FeatureGrid`
`items` (`[{ icon?, title, body, href?, linkLabel? }]`), `columns` (2/3/4),
`headingLevel` (`'h3'`), `variant` (`'plain' \| 'cards'`).

### `TagPill`
`href`, `active`, `count`, `size` (`'sm' \| 'md'`), `children`.

### `Breadcrumbs`
`items` (`[{ label, href? }]`, last = current page), `label` (nav aria-label;
pass `t('common.breadcrumb')`).

### `LatticeArt`
Decorative SVG from the logo grid. `cols`, `rows`, `at` ([col,row] of the
3x3), `animate`, `density` (`'full' \| 'sparse'`).

### `Reveal` (client)
Scroll-in "step" motion; static under reduced motion. `<Reveal>` for one
block, `<Reveal as="ul" stagger>` + `<RevealItem as="li">` for lists (named export;
server components can't dot into a client module).

## Utility classes (globals.scss)

`tm-container` (+ `--narrow`, `--wide`), `tm-grid` (auto-fill card grid,
use on `<ul>`), `tm-page-head` / `tm-page-head__inner`, `tm-page-body`,
`tm-eyebrow`, `tm-lede`, `tm-prose` (article HTML), `tm-input`, `tm-label`,
`tm-visually-hidden`, `tm-empty`.

## Other components (site-owned)

`layout/` (header, mega-menu, mobile nav, footer, theme toggle, language
switcher, cookie consent), `article/` (ArticleLayout, Prose, CodeBlock, Toc,
ShareButtons), `blog/` (LikeButton, CommentBox, Pagination, BlogListing),
`search/`, `contact/ContactForm`, `feedback/` (404 / error states).
`sections/` belongs to the marketing pages.
