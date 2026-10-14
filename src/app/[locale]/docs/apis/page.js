import fs from 'node:fs';
import path from 'node:path';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import DocsShell from '@/app/components/docs/DocsShell';
import { Button } from '@/app/components';
import s from '../docs.module.scss';
import { seoAlternates } from '@/lib/seoCanonical';

export const dynamic = 'force-static';

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

/** Endpoint list from public/swagger.json (OpenAPI 2/3), grouped by tag. */
function readSpec() {
  try {
    const spec = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/swagger.json'), 'utf8'));
    const groups = new Map();
    for (const [p, ops] of Object.entries(spec.paths || {})) {
      for (const m of METHODS) {
        const op = ops?.[m];
        if (!op) continue;
        const tag = op.tags?.[0] || 'General';
        if (!groups.has(tag)) groups.set(tag, []);
        groups.get(tag).push({ method: m, path: p, summary: op.summary || op.description || '' });
      }
    }
    return { title: spec.info?.title, version: spec.info?.version, groups: [...groups.entries()] };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const tm = await getTranslations({ locale });
  return { title: tm('docs.sections.apis.title'), description: tm('docs.sections.apis.body'), alternates: seoAlternates('/docs/apis', locale, { selfCanonical: `/${locale}/docs/apis` }) };
}

export default async function ApisPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const spec = readSpec();
  return (
    <DocsShell locale={locale} current="apis" title={t('docs.sections.apis.title')} lede={t('docs.sections.apis.body')}>
      {spec?.groups?.length ? (
        <>
          {spec.version ? <p className="tm-eyebrow" style={{ marginBottom: 'var(--tm-space-8)' }}>{`${spec.title || 'API'} · v${spec.version}`}</p> : null}
          {spec.groups.map(([tag, ops]) => (
            <section key={tag} className={s.apiGroup} aria-label={tag}>
              <h2 className={s.apiGroupTitle}>{tag}</h2>
              <ul className={s.endpoints}>
                {ops.map((op) => (
                  <li key={op.method + op.path}>
                    <span className={s.method} data-m={op.method}>
                      {op.method.toUpperCase()}
                    </span>
                    <code className={s.path}>{op.path}</code>
                    {op.summary ? <span className={s.summary}>{op.summary}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      ) : (
        <div className="tm-empty">
          <p style={{ marginBottom: 'var(--tm-space-4)' }}>{t('docs.apisEmpty')}</p>
          <Button href={`/${locale}/contact-us`} variant="secondary">
            {t('docs.apisContact')}
          </Button>
        </div>
      )}
    </DocsShell>
  );
}
