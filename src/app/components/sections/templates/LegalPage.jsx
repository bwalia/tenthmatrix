import { Hero } from '@/app/components';
import LegalDocument from '../LegalDocument';
import { uiStrings } from '../ui';

/**
 * Policy pages with { header{title,subtitle,lastUpdated,effectiveDate}, introduction,
 * sections[], transparency?, contact, acknowledgment } (privacy, cookies, terms,
 * security, data deletion).
 */
export default function LegalPage({ data, locale }) {
  const ui = uiStrings(data.ui);
  const h = data.header || {};
  const meta = [
    h.lastUpdated && `${ui.lastUpdated}: ${h.lastUpdated}`,
    h.effectiveDate && `${ui.effective}: ${h.effectiveDate}`,
  ].filter(Boolean);
  const extra = data.transparency
    ? [
        {
          id: 'transparency',
          title: data.transparency.title,
          description: data.transparency.description,
          resources: data.transparency.resources,
        },
      ]
    : [];
  return (
    <>
      <Hero title={h.title} lede={h.subtitle} meta={meta} art={false} />
      <LegalDocument data={data} ui={ui} locale={locale} extraSections={extra} />
    </>
  );
}
