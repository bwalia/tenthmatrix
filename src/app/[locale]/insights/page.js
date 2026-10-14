import { getTranslations, setRequestLocale } from 'next-intl/server';
import { loadLocaleData } from '@/utils/loadLocaleData';
import { listInsights } from '@/utils/loadInsight';
import { insightCard } from '@/lib/contentView';
import { Hero, Section, ArticleCard, Card, TagPill, Eyebrow } from '@/app/components';
import s from './insights.module.scss';

export const dynamic = 'force-static';

const loc = (href, locale) => (href?.startsWith('/') ? `/${locale}${href}` : href);

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const data = await loadLocaleData('insights/index.json', locale);
  return {
    title: { absolute: data.meta?.title || data.title },
    description: data.meta?.description,
    keywords: data.meta?.keywords,
    alternates: { canonical: `/${locale}/insights` },
  };
}

export default async function InsightsPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const data = await loadLocaleData('insights/index.json', locale);
  const items = await listInsights(locale);

  const actions = [data.primary_cta, data.secondary_cta].filter((a) => a?.href).map((a) => ({ label: a.label, href: loc(a.href, locale) }));
  const meta = [data.audience, data.landscape_cutoff ? t('insightsPage.cutoff', { date: data.landscape_cutoff }) : null].filter(Boolean);

  return (
    <>
      <Hero eyebrow={data.eyebrow} title={data.title} lede={data.lede} actions={actions.length ? actions : undefined} meta={meta} art />

      {data.series?.items?.length ? (
        <Section id="series" eyebrow={t('insightsPage.seriesEyebrow')} title={data.series.title} lede={data.series.intro}>
          <ol className={s.series}>
            {data.series.items.map((it, i) => (
              <li key={it.href}>
                <a href={loc(it.href, locale)} className={s.seriesLink}>
                  <span className={s.num}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={s.seriesCopy}>
                    <span className={s.seriesTitle}>{it.title}</span>
                    <span className={s.seriesSummary}>{it.summary}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {data.labs?.cards?.length ? (
        <Section id="labs" tone="sunken" title={data.labs.title} lede={data.labs.intro}>
          <ul className="tm-grid">
            {data.labs.cards.map((c) => (
              <li key={c.href + c.title}>
                <Card href={loc(c.href, locale)} className={s.labCard}>
                  <Eyebrow>{c.kicker}</Eyebrow>
                  <h3 className={s.labTitle}>{c.title}</h3>
                  <p className={s.labSummary}>{c.summary}</p>
                </Card>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section id="all" title={t('insightsPage.allTitle')} lede={t('insightsPage.allLede')}>
        {items.length ? (
          <ul className="tm-grid">
            {items.map((a) => (
              <li key={a.slug}>
                <ArticleCard {...insightCard(a, locale, t)} locale={locale} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="tm-empty">{t('insightsPage.empty')}</p>
        )}
      </Section>

      {data.topics?.items?.length ? (
        <Section id="topics" spacing="compact" divider title={data.topics.title} lede={data.topics.intro}>
          <ul className={s.topics}>
            {data.topics.items.map((x) => (
              <li key={x}>
                <TagPill>{x}</TagPill>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {data.ecosystem?.links?.length ? (
        <Section id="ecosystem" tone="sunken" title={data.ecosystem.title} lede={data.ecosystem.intro}>
          <ul className="tm-grid">
            {data.ecosystem.links.map((c) => (
              <li key={c.href}>
                <Card href={loc(c.href, locale)} className={s.labCard} prefetch={false}>
                  <Eyebrow>{c.kicker}</Eyebrow>
                  <h3 className={s.labTitle}>{c.title}</h3>
                  <p className={s.labSummary}>{c.summary}</p>
                </Card>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
