import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Bot, GitBranch, Download } from 'lucide-react';
import Logo from '@/app/brand-assets/Logo';
import LogoMark from '@/app/brand-assets/LogoMark';
import { Hero, Section, Button, Eyebrow, TagPill, Card, ProductCard, ArticleCard, LatticeArt } from '@/app/components';
import CodeBlock from '@/app/components/article/CodeBlock';
import { PALETTE, TYPE_SCALE, contrast, rating } from './palette';
import s from './brand.module.scss';

export const dynamic = 'force-static';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'brandPage' });
  return { title: t('title'), description: t('lede'), robots: { index: false, follow: false }, alternates: { canonical: `/${locale}/brand` } };
}

const FILES = [
  'tm-logo.svg',
  'tm-logo-on-dark.svg',
  'tm-logo-stacked.svg',
  'tm-logo-stacked-on-dark.svg',
  'tm-mark.svg',
  'tm-mark-on-dark.svg',
  'tm-logo-mono-dark.svg',
  'tm-logo-mono-light.svg',
  'tm-mark-mono.svg',
  'icon.svg',
  'og-background.png',
];

const SAMPLE_CODE = `# Promote a release only when every health gate passes
ring-promoter promote api \\
  --from test --to acc \\
  --require "p95_latency_ms < 300" \\
  --require "error_rate < 0.5%" \\
  --rollback-on-fail`;

/** Components rendered once per theme panel. */
function Specimens({ locale, theme }) {
  return (
    <div className={s.specimens}>
      <div className={s.row}>
        <Button>Start a pilot</Button>
        <Button variant="secondary">See the products</Button>
        <Button variant="tertiary" href={`/${locale}/articles`}>
          Read the architecture
        </Button>
      </div>
      <div className={s.row}>
        <Eyebrow>Eyebrow label</Eyebrow>
        <TagPill>observability</TagPill>
        <TagPill active>agents</TagPill>
        <TagPill size="sm">mcp</TagPill>
      </div>
      <div className={s.cards}>
        <ProductCard
          name="Ring Promoter"
          tagline="CI/CD control plane"
          description="Promotes every release through int, test, acc and prod rings. Health gates decide."
          href={`/${locale}/ring-promoter`}
          icon={GitBranch}
          status="v1.0.2"
          cta="See Ring Promoter"
          headingLevel="h4"
        />
        <ArticleCard
          title="WSL Vault: zero-trust tenant isolation"
          href={`/${locale}/articles`}
          excerpt="Envelope encryption with a key hierarchy per tenant, and what happens when a node is stolen."
          date="2026-10-07"
          locale={locale}
          kind="Article"
          readingTime="9 min read"
          tags={['Security', 'Kubernetes']}
          headingLevel="h4"
        />
      </div>
      <Card tone="sunken" padding="md" className={s.formCard}>
        <label className="tm-label" htmlFor={`brand-input-${theme}`}>
          Work email
        </label>
        <input id={`brand-input-${theme}`} className="tm-input" placeholder="you@company.com" />
      </Card>
      <CodeBlock code={SAMPLE_CODE} language="bash" />
      <div className="tm-prose">
        <h4>Article typography</h4>
        <p>
          Body copy is Instrument Sans at 16–17&nbsp;px with a 1.72 line height and a 68-character measure. Links are <a href="#palette">viridian</a>, inline
          code reads <code>tm-theme.css</code>.
        </p>
        <ul>
          <li>Lists use accent square markers</li>
          <li>Numbers in ordered lists are mono</li>
        </ul>
        <blockquote>
          <p>The model is the grid. The agent is the tenth cell.</p>
        </blockquote>
        <table>
          <thead>
            <tr>
              <th>Ring</th>
              <th>Gate</th>
              <th>Rollback</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>int → test</td>
              <td>smoke</td>
              <td>auto</td>
            </tr>
            <tr>
              <td>acc → prod</td>
              <td>p95 &lt; 300 ms</td>
              <td>auto</td>
            </tr>
          </tbody>
        </table>
        <aside className="callout">
          <p>
            <strong>Callout.</strong> Used for notes and limits. Say what it doesn't do.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default async function BrandPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'brandPage' });

  return (
    <div className={s.page}>
      <Hero eyebrow={t('eyebrow')} title={t('title')} lede={t('lede')} art={<LatticeArt cols={10} rows={7} at={[2, 3]} />} />

      <Section id="logo" eyebrow="01" title={t('logoTitle')} lede={t('logoLede')}>
        <div className={s.duo}>
          {['light', 'dark'].map((theme) => (
            <div key={theme} data-theme={theme} className={s.panel}>
              <p className={s.panelLabel}>{t(theme)}</p>
              <div className={s.logoStage}>
                <Logo size={40} title="" />
              </div>
              <div className={s.logoRow}>
                <Logo layout="stacked" size={88} title="" />
                <div className={s.marks}>
                  {[16, 24, 32, 48, 64].map((n) => (
                    <figure key={n} className={s.markFig}>
                      <LogoMark size={n} title="" />
                      <figcaption>{n}px</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
              <div className={s.monoRow}>
                <Logo variant="mono" size={24} title="" className={s.mono} />
              </div>
            </div>
          ))}
        </div>
        <ul className={s.files}>
          {FILES.map((f) => (
            <li key={f}>
              <a href={`/brand/${f}`} download>
                <Download aria-hidden="true" size={14} />
                {f}
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="palette" eyebrow="02" title={t('paletteTitle')} lede={t('paletteLede')} tone="surface">
        <div className={s.duo}>
          {Object.entries(PALETTE).map(([theme, p]) => {
            const text = p.swatches.find((x) => x[0] === '--tm-text')[1];
            return (
              <div key={theme} data-theme={theme} className={s.panel}>
                <p className={s.panelLabel}>{t(theme)}</p>
                <ul className={s.swatches}>
                  {p.swatches.map(([name, hex, kind]) => {
                    const against = kind === 'surface' || kind === 'line' ? text : p.bg;
                    const ratio = contrast(hex, against);
                    const r = rating(kind, ratio);
                    return (
                      <li key={name} className={s.swatch}>
                        <span className={s.chip} style={{ background: hex }} />
                        <span className={s.swatchName}>{name}</span>
                        <span className={s.swatchHex}>{hex}</span>
                        <span className={s.ratio} data-r={r}>
                          {ratio.toFixed(2)}:1 · {r}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className={s.note}>{t('contrastNote')}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section id="type" eyebrow="03" title={t('typeTitle')} lede={t('typeLede')}>
        <div className={s.families}>
          <div>
            <p className="tm-eyebrow">Display</p>
            <p className={s.famDisplay}>Bricolage Grotesque</p>
          </div>
          <div>
            <p className="tm-eyebrow">Body</p>
            <p className={s.famBody}>Instrument Sans</p>
          </div>
          <div>
            <p className="tm-eyebrow">Mono</p>
            <p className={s.famMono}>IBM Plex Mono</p>
          </div>
        </div>
        <ul className={s.scale}>
          {TYPE_SCALE.map(([token, label, role]) => (
            <li key={token} className={s.scaleRow}>
              <span className={s.scaleToken}>
                {token}
                <span>{label}</span>
              </span>
              <span className={s[`role-${role}`]} style={{ fontSize: `var(${token})` }}>
                Agents that do the job
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="components" eyebrow="04" title={t('componentsTitle')} lede={t('componentsLede')} tone="sunken" width="wide">
        <div className={s.duo}>
          {['light', 'dark'].map((theme) => (
            <div key={theme} data-theme={theme} className={s.panel}>
              <p className={s.panelLabel}>{t(theme)}</p>
              <Specimens locale={locale} theme={theme} />
            </div>
          ))}
        </div>
      </Section>

      <Section id="icons" eyebrow="05" title={t('iconsTitle')} lede={t('iconsLede')} spacing="compact">
        <div className={s.iconRow}>
          <span className={s.iconBox} aria-hidden="true">
            <Bot size={22} strokeWidth={1.75} />
          </span>
          <span className={s.iconBox} aria-hidden="true">
            <GitBranch size={22} strokeWidth={1.75} />
          </span>
          <p className={s.note}>lucide-react · 1.75 stroke at 20–24 px · 40 px accent-soft tile</p>
        </div>
      </Section>
    </div>
  );
}
