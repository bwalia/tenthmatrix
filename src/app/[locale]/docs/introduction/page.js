import { getTranslations, setRequestLocale } from 'next-intl/server';
import DocsShell from '@/app/components/docs/DocsShell';
import { Card, TagPill } from '@/app/components';
import { loadDocsData } from '../docsData';
import s from '../docs.module.scss';

export const dynamic = 'force-static';

const PROSE_KEYS = ['flexibility', 'security', 'speed', 'reliability'];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const data = await loadDocsData('introduction.json', locale);
  const tm = await getTranslations({ locale });
  return { title: data?.header?.title || tm('docs.sections.introduction.title'), description: tm('docs.sections.introduction.body'), alternates: { canonical: `/${locale}/docs/introduction` } };
}

// Renders introduction.json: header, video, capability cards, the four prose
// sections and the technology list. Pricing tiers, counters and testimonials
// in the source file are left out until they are verified.
export default async function IntroductionPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const data = await loadDocsData('introduction.json', locale);
  if (!data) {
    return (
      <DocsShell locale={locale} current="introduction" title={t('docs.sections.introduction.title')}>
        <p className="tm-empty">{t('docs.empty')}</p>
      </DocsShell>
    );
  }
  return (
    <DocsShell locale={locale} current="introduction" title={data.header?.title || t('docs.sections.introduction.title')} lede={data.header?.description}>
      {data.video?.embedUrl ? (
        <figure className={s.video}>
          <iframe
            src={data.video.embedUrl.replace('youtube.com/embed', 'youtube-nocookie.com/embed')}
            title={data.video.title || 'Video'}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {data.video.title ? <figcaption>{data.video.title}</figcaption> : null}
        </figure>
      ) : null}
      {data.aiTechnology?.sections?.length ? (
        <section aria-labelledby="intro-capabilities">
          <h2 id="intro-capabilities">{data.aiTechnology.title}</h2>
          {data.aiTechnology.subtitle ? <p className="tm-lede" style={{ marginTop: 'var(--tm-space-3)' }}>{data.aiTechnology.subtitle}</p> : null}
          <ul className={s.introGrid}>
            {data.aiTechnology.sections.map((sec) => (
              <li key={sec.title}>
                <Card as="article" style={{ height: '100%', gap: 'var(--tm-space-3)' }}>
                  <h3 style={{ fontSize: 'var(--tm-text-lg)' }}>{sec.title}</h3>
                  <p style={{ color: 'var(--tm-text-muted)', fontSize: 'var(--tm-text-sm)' }}>{sec.description}</p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="tm-prose">
        {PROSE_KEYS.filter((k) => data[k]?.title).map((k) => (
          <section key={k}>
            <h2>{data[k].title}</h2>
            <p>{data[k].description}</p>
          </section>
        ))}
      </div>
      {data.technologies?.items?.length ? (
        <section aria-labelledby="intro-tech" style={{ marginTop: 'var(--tm-space-12)' }}>
          <h2 id="intro-tech" style={{ marginBottom: 'var(--tm-space-5)' }}>
            {data.technologies.title}
          </h2>
          <ul className={s.techList}>
            {data.technologies.items.map((x) => (
              <li key={x.name}>
                <TagPill title={x.description}>{x.name}</TagPill>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </DocsShell>
  );
}
