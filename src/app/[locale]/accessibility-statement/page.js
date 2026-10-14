import { Hero } from '@/app/components';
import { createRoute } from '@/app/components/sections/createRoute';
import LegalDocument from '@/app/components/sections/LegalDocument';
import { uiStrings } from '@/app/components/sections/ui';

export const dynamic = 'force-static';

function Accessibility({ data, locale }) {
  const ui = uiStrings(data.ui);
  const c = data.content || {};
  const sections = [c.commitment, c.features, c.standards, c.limitations].filter(Boolean);
  const contact = c.contact && {
    title: c.contact.title,
    description: c.contact.description,
    methods: [
      c.contact.email && { label: ui.email, value: c.contact.email, icon: 'fas fa-envelope' },
      c.contact.phone && { label: ui.phone, value: c.contact.phone, icon: 'fas fa-phone' },
    ].filter(Boolean),
  };
  return (
    <>
      <Hero
        title={data.hero?.title}
        lede={data.hero?.description}
        meta={c.lastUpdated ? [`${ui.lastUpdated}: ${c.lastUpdated}`] : undefined}
        art={false}
      />
      <LegalDocument data={{ sections, contact }} ui={ui} locale={locale} />
    </>
  );
}

const route = createRoute({ file: 'accessibility-statement.json', route: '/accessibility-statement', Template: Accessibility });

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
