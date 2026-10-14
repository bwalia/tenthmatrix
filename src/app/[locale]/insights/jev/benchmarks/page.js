import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';
import { loadLocaleData } from '@/utils/loadLocaleData';
import { Hero, Section, Breadcrumbs } from '@/app/components';
import s from './benchmarks.module.scss';

export const dynamic = 'force-static';

async function load(locale) {
  try {
    return await loadLocaleData('insights/benchmarks/lab.json', locale);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const data = await load(locale);
  return {
    title: { absolute: data?.meta?.title || 'Jev Benchmark Lab | TenthMatrix' },
    description: data?.meta?.description,
    alternates: { canonical: `/${locale}/insights/jev/benchmarks` },
  };
}

export default async function BenchmarksPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const data = await load(locale);
  if (!data) {
    return (
      <Hero eyebrow={t('nav.items.jev.label')} title={t('insightsPage.labTitle')} lede={t('insightsPage.empty')} />
    );
  }
  const metrics = data.metrics || [];
  const kindLabel = (k) => (t.has(`insightsPage.sourceKinds.${k}`) ? t(`insightsPage.sourceKinds.${k}`) : k);

  return (
    <>
      <Hero
        eyebrow={`${t('nav.items.jev.label')} · ${data.version || ''}`}
        title={data.title}
        lede={data.lede}
        meta={[data.updated ? t('insightsPage.updated', { date: data.updated }) : null, data.landscape_cutoff ? t('insightsPage.cutoff', { date: data.landscape_cutoff }) : null].filter(Boolean)}
      >
        <Breadcrumbs
          className={s.crumbs}
          label={t('common.breadcrumb')}
          items={[
            { label: t('nav.items.insights.label'), href: `/${locale}/insights` },
            { label: 'Jev', href: `/${locale}/insights/jev` },
            { label: data.title },
          ]}
        />
      </Hero>
      <Section id="method" spacing="compact">
        {data.methodology_notice ? (
          <div className={s.notice}>
            <p className={s.noticeLabel}>{t('insightsPage.methodology')}</p>
            <p>{data.methodology_notice}</p>
          </div>
        ) : null}
      </Section>
      {(data.suites || []).map((suite) => (
        <Section key={suite.id} id={suite.id} title={suite.title} lede={suite.description} spacing="compact" divider>
          <ul className={s.facts}>
            {suite.version ? <li>{suite.version}</li> : null}
            {suite.date ? <li>{suite.date}</li> : null}
            {suite.samples ? <li>{t('insightsPage.samples', { samples: suite.samples })}</li> : null}
          </ul>
          <div className={s.tableWrap} tabIndex={0} role="region" aria-label={suite.title}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">{t('insightsPage.system')}</th>
                  <th scope="col">{t('insightsPage.source')}</th>
                  {metrics.map((m) => (
                    <th scope="col" key={m.id}>
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(suite.results || []).map((r, i) => (
                  <tr key={i}>
                    <th scope="row">{r.system}</th>
                    <td>
                      <span className={s.kind} data-kind={r.source_kind}>
                        {kindLabel(r.source_kind)}
                      </span>
                      {r.source_url ? (
                        <a href={r.source_url} rel="noopener noreferrer" target="_blank" className={s.src}>
                          {r.source}
                          <ArrowUpRight aria-hidden="true" size={12} />
                        </a>
                      ) : (
                        <span className={s.src}>{r.source}</span>
                      )}
                    </td>
                    {metrics.map((m) => {
                      const display = r.metrics_display?.[m.id] ?? (m.id.startsWith('cost') ? r.metrics_display?.cost_note : undefined);
                      const v = display ?? r.metrics?.[m.id];
                      return <td key={m.id}>{v ?? '–'}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {suite.does_not_prove ? <p className={s.caveat}>{suite.does_not_prove}</p> : null}
        </Section>
      ))}
    </>
  );
}
