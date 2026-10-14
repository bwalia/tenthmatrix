import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadPage, localeParams, pageMetadata } from './meta';

/**
 * Builds the standard exports for a JSON-driven marketing route:
 *   const r = createRoute({ file: 'ai-agents.json', route: '/ai-agents', Template });
 *   export const generateStaticParams = r.generateStaticParams;
 *   export const generateMetadata = r.generateMetadata;
 *   export default r.Page;
 * `meta(data)` may return { title, description } fallbacks for JSON without a meta block.
 */
export function createRoute({ file, route, Template, meta, props = {} }) {
  async function generateMetadata({ params }) {
    const { locale } = await params;
    const data = await loadPage(file, locale);
    if (!data) return {};
    return pageMetadata({ locale, route, data, ...(meta ? meta(data) : {}) });
  }

  async function Page({ params }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const data = await loadPage(file, locale);
    if (!data) notFound();
    return <Template data={data} locale={locale} route={route} {...props} />;
  }

  return { generateStaticParams: localeParams, generateMetadata, Page };
}
