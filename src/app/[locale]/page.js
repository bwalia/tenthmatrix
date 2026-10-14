import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  AppWindow,
  Plug,
  GitBranch,
  Shield,
  KeyRound,
  Briefcase,
  Gauge,
  Database,
  UserCheck,
  Server,
  Lock,
  LineChart,
  Wrench,
  ClipboardCheck,
  Users,
  Handshake,
  ArrowLeftRight,
} from 'lucide-react';
import { getPostListPage } from '@/lib/cms';
import { localizeBlogMetaList } from '@/utils/loadBlog';
import { loadArticles } from '@/utils/articlesLocale';
import { blogCard, articleCard } from '@/lib/contentView';
import { Hero, Section, Card, ProductCard, ArticleCard, CTA, Button, Eyebrow, Reveal, RevealItem } from '@/app/components';
import { NAV_GROUPS, HARDWARE_URL } from '@/app/components/layout/navConfig';
import s from './home.module.scss';

// ISR: latest writing refreshes hourly (and on /api/revalidate).
export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const tm = await getTranslations({ locale });
  return {
    title: { absolute: tm('home.meta.title') },
    description: tm('home.meta.description'),
    alternates: { canonical: `/${locale}` },
  };
}

/** 3x3 lattice that fills one row per step; step 4 lights the tenth cell. */
function StepGlyph({ step }) {
  const filled = [3, 6, 9, 9][step - 1];
  const cells = [];
  for (let i = 0; i < 9; i++) {
    const r = Math.floor(i / 3);
    const c = i % 3;
    cells.push(<rect key={i} x={c * 8} y={10 + r * 8} width="6" height="6" rx="1" className={i < filled ? s.on : s.off} />);
  }
  return (
    <svg viewBox="0 0 32 32" width="40" height="40" aria-hidden="true" className={s.glyph}>
      {cells}
      <rect x="26" y="0" width="6" height="6" rx="1" className={step === 4 ? s.tenth : s.off} />
    </svg>
  );
}

const PILLARS = [
  { key: 'agents', icon: Bot, links: ['aiAgentDev', 'aiAgents', 'claudeAgents'] },
  { key: 'genai', icon: AppWindow, links: ['genAiDev', 'generativeAi', 'appliedAi'] },
  { key: 'integrations', icon: Plug, links: ['softwareDevelopment', 'dataFoundations', 'devops'] },
];

// Benefits of TenthMatrix agents: each one links to the thing that proves it.
const BENEFITS = [
  { key: 'approval', icon: UserCheck, href: '/jobshout' },
  { key: 'hosting', icon: Server, href: '/outsource-ai-development#engagement' },
  { key: 'data', icon: Lock, href: '/outsource-ai-development#security-ip' },
  { key: 'vault', icon: KeyRound, href: '/wsl-vault' },
  { key: 'releases', icon: GitBranch, href: '/ring-promoter' },
  { key: 'edge', icon: Shield, href: '/wsl-proxy' },
  { key: 'observe', icon: LineChart, href: '/articles/llm-bottlenecks-observability-otel-cost-control' },
  { key: 'production', icon: Wrench, href: '/articles' },
];

const ENGAGEMENTS = [
  { key: 'fixed', icon: ClipboardCheck },
  { key: 'team', icon: Users },
  { key: 'embedded', icon: Handshake },
  { key: 'transfer', icon: ArrowLeftRight },
];

const PRODUCTS = [
  { key: 'ringPromoter', name: 'Ring Promoter', href: '/ring-promoter', icon: GitBranch },
  { key: 'wslProxy', name: 'WSL Proxy', href: '/wsl-proxy', icon: Shield },
  { key: 'wslVault', name: 'WSL Vault', href: '/wsl-vault', icon: KeyRound, status: 'openSource' },
  { key: 'jobshout', name: 'Jobshout', href: '/jobshout', icon: Briefcase, status: 'openSource' },
  { key: 'jev', name: 'Jev', href: '/insights/jev', icon: Gauge, status: 'research' },
  { key: 'nebula', href: '/products', icon: Database },
];

export default async function HomePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const href = (p) => `/${locale}${p}`;
  const navHref = (key) => NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === key)?.href || '/';

  const { blogs } = await getPostListPage({ page: 1 });
  const articles = await loadArticles(locale);
  const latest = [
    ...localizeBlogMetaList(blogs, locale).filter((b) => !/^__/.test(b.slug)).slice(0, 4).map((b) => blogCard(b, locale, t)),
    ...(articles?.data?.content || []).filter((a) => a?.code && !/^__/.test(a.code)).map((a) => articleCard(a, locale, t)),
  ]
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, 3);

  const steps = t.raw('home.steps.items');

  return (
    <div className="tm-home">
      <Hero
        variant="home"
        eyebrow={t('home.hero.eyebrow')}
        title={t('home.hero.title')}
        lede={t('home.hero.lede')}
        actions={[
          { label: t('home.hero.primary'), href: href('/start-a-project'), arrow: true },
          { label: t('home.hero.secondary'), href: '#benefits' },
        ]}
        meta={t.raw('home.hero.meta')}
        art
      />

      <Section id="build" eyebrow={t('home.pillars.eyebrow')} title={t('home.pillars.title')} lede={t('home.pillars.lede')}>
        <Reveal as="ul" stagger className={s.pillars}>
          {PILLARS.map(({ key, icon: Icon, links }, i) => (
            <RevealItem as="li" key={key}>
              <Card as="article" className={s.pillar}>
                <div className={s.pillarTop}>
                  <span className={s.pillarIcon} aria-hidden="true">
                    <Icon size={22} strokeWidth={1.75} />
                  </span>
                  <span className={s.pillarIndex}>0{i + 1}</span>
                </div>
                <h3 className={s.pillarTitle}>{t(`home.pillars.${key}.title`)}</h3>
                <p className={s.pillarBody}>{t(`home.pillars.${key}.body`)}</p>
                <ul className={s.pillarLinks}>
                  {links.map((k) => (
                    <li key={k}>
                      <Link href={href(navHref(k))} prefetch={false}>
                        <span>{t(`nav.items.${k}.label`)}</span>
                        <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      <Section
        id="benefits"
        tone="surface"
        eyebrow={t('home.benefits.eyebrow')}
        title={t('home.benefits.title')}
        lede={t('home.benefits.lede')}
        actions={
          <Button href={href('/why-tenthmatrix-agents')} variant="tertiary" prefetch={false}>
            {t('home.benefits.all')}
          </Button>
        }
      >
        <Reveal as="ul" stagger className={s.benefits}>
          {BENEFITS.map(({ key, icon: Icon, href: proof }) => (
            <RevealItem as="li" key={key} className={s.benefit}>
              <span className={s.benefitIcon} aria-hidden="true">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <h3 className={s.benefitTitle}>{t(`home.benefits.${key}.title`)}</h3>
              <p className={s.benefitBody}>{t(`home.benefits.${key}.body`)}</p>
              <Link href={href(proof)} className={s.benefitProof} prefetch={false}>
                <span>{t(`home.benefits.${key}.proof`)}</span>
                <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
              </Link>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      <Section id="process" eyebrow={t('home.steps.eyebrow')} title={t('home.steps.title')} lede={t('home.steps.lede')}>
        <Reveal as="ol" stagger className={s.steps}>
          {steps.map((step, i) => (
            <RevealItem as="li" key={step.title} className={s.step}>
              <StepGlyph step={i + 1} />
              <p className={s.stepNum}>
                {String(i + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
              </p>
              <h3 className={s.stepTitle}>{step.title}</h3>
              <p className={s.stepBody}>{step.body}</p>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      <Section
        id="engagement"
        tone="sunken"
        eyebrow={t('home.engagement.eyebrow')}
        title={t('home.engagement.title')}
        lede={t('home.engagement.lede')}
        actions={
          <Button href={href('/outsource-ai-development#engagement')} variant="tertiary" prefetch={false}>
            {t('home.engagement.more')}
          </Button>
        }
      >
        <Reveal as="ul" stagger className={s.engagements}>
          {ENGAGEMENTS.map(({ key, icon: Icon }) => (
            <RevealItem as="li" key={key}>
              <Card as="article" className={s.engagement}>
                <span className={s.pillarIcon} aria-hidden="true">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <h3 className={s.engagementTitle}>{t(`home.engagement.${key}.title`)}</h3>
                <p className={s.engagementBody}>{t(`home.engagement.${key}.body`)}</p>
              </Card>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      <Section
        id="products"
        eyebrow={t('home.products.eyebrow')}
        title={t('home.products.title')}
        lede={t('home.products.lede')}
        actions={
          <Button href={href('/products')} variant="tertiary" prefetch={false}>
            {t('home.products.all')}
          </Button>
        }
      >
        <Reveal as="ul" stagger className={`tm-grid ${s.products}`}>
          {PRODUCTS.map((p) => {
            const name = p.name || t(`home.products.${p.key}.name`);
            return (
              <RevealItem as="li" key={p.key}>
                <ProductCard
                  name={name}
                  tagline={t(`home.products.${p.key}.tagline`)}
                  description={t(`home.products.${p.key}.description`)}
                  href={href(p.href)}
                  icon={p.icon}
                  status={p.status ? t(`home.products.${p.status}`) : undefined}
                  cta={t('home.products.see', { name })}
                />
              </RevealItem>
            );
          })}
        </Reveal>
      </Section>

      <Section
        id="writing"
        tone="sunken"
        eyebrow={t('home.latestSection.eyebrow')}
        title={t('home.latestSection.title')}
        lede={t('home.latestSection.lede')}
        actions={
          <div className={s.writingActions}>
            <Button href={href('/articles')} variant="secondary" size="sm">
              {t('home.latestSection.articles')}
            </Button>
            <Button href={href('/docs/blogs')} variant="tertiary" size="sm">
              {t('home.latestSection.blog')}
            </Button>
          </div>
        }
      >
        {latest.length ? (
          <ul className="tm-grid">
            {latest.map((c) => (
              <li key={c.href}>
                <ArticleCard {...c} locale={locale} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="tm-empty">{t('home.latestSection.empty')}</p>
        )}
      </Section>

      <section className={s.hardware} aria-labelledby="hardware-title">
        <div className={s.hardwareInner}>
          <div className={s.hardwareCopy}>
            <Eyebrow>{t('home.hardware.eyebrow')}</Eyebrow>
            <h2 id="hardware-title" className={s.hardwareTitle}>
              {t('home.hardware.title')}
            </h2>
            <p className={s.hardwareBody}>{t('home.hardware.body')}</p>
          </div>
          <a href={HARDWARE_URL} className={s.hardwareLink} rel="noopener">
            {t('home.hardware.link')}
            <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.75} />
          </a>
        </div>
      </section>

      <CTA
        id="cta"
        eyebrow={t('home.cta.eyebrow')}
        title={t('home.cta.title')}
        body={t('home.cta.body')}
        primary={{ label: t('home.cta.primary'), href: href('/start-a-project') }}
        secondary={{ label: t('home.cta.secondary'), href: href('/outsource-ai-development') }}
      />
    </div>
  );
}
